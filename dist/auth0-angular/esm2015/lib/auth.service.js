import { Injectable, Inject } from '@angular/core';
import {
  of,
  from,
  BehaviorSubject,
  Subject,
  iif,
  defer,
  ReplaySubject,
  merge,
  throwError,
} from 'rxjs';
import {
  concatMap,
  tap,
  map,
  filter,
  takeUntil,
  distinctUntilChanged,
  catchError,
  switchMap,
  mergeMap,
} from 'rxjs/operators';
import { Auth0ClientService } from './auth.client';
import * as i0 from '@angular/core';
import * as i1 from './auth.config';
import * as i2 from '@angular/common';
import * as i3 from './abstract-navigator';
import * as i4 from '@auth0/auth0-spa-js';
export class AuthService {
  constructor(auth0Client, configFactory, location, navigator) {
    this.auth0Client = auth0Client;
    this.configFactory = configFactory;
    this.location = location;
    this.navigator = navigator;
    this.isLoadingSubject$ = new BehaviorSubject(true);
    this.errorSubject$ = new ReplaySubject(1);
    this.refreshState$ = new Subject();
    // https://stackoverflow.com/a/41177163
    this.ngUnsubscribe$ = new Subject();
    /**
     * Emits boolean values indicating the loading state of the SDK.
     */
    this.isLoading$ = this.isLoadingSubject$.asObservable();
    /**
     * Trigger used to pull User information from the Auth0Client.
     * Triggers when an event occurs that needs to retrigger the User Profile information.
     * Such as: Initially, getAccessTokenSilently, getAccessTokenWithPopup and Logout
     */
    this.isAuthenticatedTrigger$ = this.isLoading$.pipe(
      filter((loading) => !loading),
      distinctUntilChanged(),
      switchMap(() =>
        // To track the value of isAuthenticated over time, we need to merge:
        //  - the current value
        //  - the value whenever refreshState$ emits
        merge(
          defer(() => this.auth0Client.isAuthenticated()),
          this.refreshState$.pipe(
            mergeMap(() => this.auth0Client.isAuthenticated())
          )
        )
      )
    );
    /**
     * Emits boolean values indicating the authentication state of the user. If `true`, it means a user has authenticated.
     * This depends on the value of `isLoading$`, so there is no need to manually check the loading state of the SDK.
     */
    this.isAuthenticated$ = this.isAuthenticatedTrigger$.pipe(
      distinctUntilChanged()
    );
    /**
     * Emits details about the authenticated user, or null if not authenticated.
     */
    this.user$ = this.isAuthenticatedTrigger$.pipe(
      concatMap((authenticated) =>
        authenticated ? this.auth0Client.getUser() : of(null)
      )
    );
    /**
     * Emits ID token claims when authenticated, or null if not authenticated.
     */
    this.idTokenClaims$ = this.isAuthenticatedTrigger$.pipe(
      concatMap((authenticated) =>
        authenticated ? this.auth0Client.getIdTokenClaims() : of(null)
      )
    );
    /**
     * Emits errors that occur during login, or when checking for an active session on startup.
     */
    this.error$ = this.errorSubject$.asObservable();
    const checkSessionOrCallback$ = (isCallback) =>
      iif(
        () => isCallback,
        this.handleRedirectCallback(),
        defer(() => this.auth0Client.checkSession())
      );
    this.shouldHandleCallback()
      .pipe(
        switchMap((isCallback) =>
          checkSessionOrCallback$(isCallback).pipe(
            catchError((error) => {
              const config = this.configFactory.get();
              this.errorSubject$.next(error);
              this.navigator.navigateByUrl(config.errorPath || '/');
              return of(undefined);
            })
          )
        ),
        tap(() => {
          this.isLoadingSubject$.next(false);
        }),
        takeUntil(this.ngUnsubscribe$)
      )
      .subscribe();
  }
  /**
   * Called when the service is destroyed
   */
  ngOnDestroy() {
    // https://stackoverflow.com/a/41177163
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
  /**
   * ```js
   * loginWithRedirect(options);
   * ```
   *
   * Performs a redirect to `/authorize` using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated.
   *
   * @param options The login options
   */
  loginWithRedirect(options) {
    return from(this.auth0Client.loginWithRedirect(options));
  }
  /**
   * ```js
   * await loginWithPopup(options);
   * ```
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   *
   * IMPORTANT: This method has to be called from an event handler
   * that was started by the user like a button click, for example,
   * otherwise the popup will be blocked in most browsers.
   *
   * @param options The login options
   * @param config Configuration for the popup window
   */
  loginWithPopup(options, config) {
    return from(
      this.auth0Client.loginWithPopup(options, config).then(() => {
        this.refreshState$.next();
      })
    );
  }
  /**
   * ```js
   * logout();
   * ```
   *
   * Clears the application session and performs a redirect to `/v2/logout`, using
   * the parameters provided as arguments, to clear the Auth0 session.
   * If the `federated` option is specified it also clears the Identity Provider session.
   * If the `localOnly` option is specified, it only clears the application session.
   * It is invalid to set both the `federated` and `localOnly` options to `true`,
   * and an error will be thrown if you do.
   * [Read more about how Logout works at Auth0](https://auth0.com/docs/logout).
   *
   * @param options The logout options
   */
  logout(options) {
    this.auth0Client.logout(options);
    if (options === null || options === void 0 ? void 0 : options.localOnly) {
      this.refreshState$.next();
    }
  }
  /**
   * ```js
   * getAccessTokenSilently(options).subscribe(token => ...)
   * ```
   *
   * If there's a valid token stored, return it. Otherwise, opens an
   * iframe with the `/authorize` URL using the parameters provided
   * as arguments. Random and secure `state` and `nonce` parameters
   * will be auto-generated. If the response is successful, results
   * will be valid according to their expiration times.
   *
   * If refresh tokens are used, the token endpoint is called directly with the
   * 'refresh_token' grant. If no refresh token is available to make this call,
   * the SDK falls back to using an iframe to the '/authorize' URL.
   *
   * This method may use a web worker to perform the token call if the in-memory
   * cache is used.
   *
   * If an `audience` value is given to this function, the SDK always falls
   * back to using an iframe to make the token exchange.
   *
   * Note that in all cases, falling back to an iframe requires access to
   * the `auth0` cookie, and thus will not work in browsers that block third-party
   * cookies by default (Safari, Brave, etc).
   *
   * @param options The options for configuring the token fetch.
   */
  getAccessTokenSilently(options) {
    return of(this.auth0Client).pipe(
      concatMap((client) => client.getTokenSilently(options)),
      tap(() => this.refreshState$.next()),
      catchError((error) => {
        this.errorSubject$.next(error);
        this.refreshState$.next();
        return throwError(error);
      })
    );
  }
  /**
   * ```js
   * getTokenWithPopup(options).subscribe(token => ...)
   * ```
   *
   * Get an access token interactively.
   *
   * Opens a popup with the `/authorize` URL using the parameters
   * provided as arguments. Random and secure `state` and `nonce`
   * parameters will be auto-generated. If the response is successful,
   * results will be valid according to their expiration times.
   */
  getAccessTokenWithPopup(options) {
    return of(this.auth0Client).pipe(
      concatMap((client) => client.getTokenWithPopup(options)),
      tap(() => this.refreshState$.next()),
      catchError((error) => {
        this.errorSubject$.next(error);
        this.refreshState$.next();
        return throwError(error);
      })
    );
  }
  auth0HandleCallback(url) {
    if (
      ((url === null || url === void 0 ? void 0 : url.includes('code=')) ||
        (url === null || url === void 0 ? void 0 : url.includes('error='))) &&
      (url === null || url === void 0 ? void 0 : url.includes('state='))
    ) {
      from(this.auth0Client.handleRedirectCallback(url))
        .pipe(
          map((result) => {
            let target = '/';
            if (result) {
              if (result.appState) {
                if (result.appState.target) {
                  target = result.appState.target;
                }
              }
            }
            this.navigator.navigateByUrl(target);
          }),
          tap(() => {
            this.refreshState$.next();
            this.isLoadingSubject$.next(false);
          }),
          takeUntil(this.ngUnsubscribe$)
        )
        .subscribe();
    }
  }
  shouldHandleCallback() {
    return of(this.location.path()).pipe(
      map((search) => {
        return (
          (search.includes('code=') || search.includes('error=')) &&
          search.includes('state=') &&
          !this.configFactory.get().skipRedirectCallback
        );
      })
    );
  }
  handleRedirectCallback() {
    return defer(() => this.auth0Client.handleRedirectCallback()).pipe(
      tap((result) => {
        var _a, _b;
        const target =
          (_b =
            (_a =
              result === null || result === void 0
                ? void 0
                : result.appState) === null || _a === void 0
              ? void 0
              : _a.target) !== null && _b !== void 0
            ? _b
            : '/';
        this.navigator.navigateByUrl(target);
      })
    );
  }
}
AuthService.ɵfac = function AuthService_Factory(t) {
  return new (t || AuthService)(
    i0.ɵɵinject(Auth0ClientService),
    i0.ɵɵinject(i1.AuthClientConfig),
    i0.ɵɵinject(i2.Location),
    i0.ɵɵinject(i3.AbstractNavigator)
  );
};
AuthService.ɵprov = i0.ɵɵdefineInjectable({
  token: AuthService,
  factory: AuthService.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  i0.ɵsetClassMetadata(
    AuthService,
    [
      {
        type: Injectable,
        args: [
          {
            providedIn: 'root',
          },
        ],
      },
    ],
    function () {
      return [
        {
          type: i4.Auth0Client,
          decorators: [
            {
              type: Inject,
              args: [Auth0ClientService],
            },
          ],
        },
        { type: i1.AuthClientConfig },
        { type: i2.Location },
        { type: i3.AbstractNavigator },
      ];
    },
    null
  );
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL3Byb2plY3RzL2F1dGgwLWFuZ3VsYXIvc3JjLyIsInNvdXJjZXMiOlsibGliL2F1dGguc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBYSxNQUFNLGVBQWUsQ0FBQztBQWE5RCxPQUFPLEVBQ0wsRUFBRSxFQUNGLElBQUksRUFDSixlQUFlLEVBQ2YsT0FBTyxFQUVQLEdBQUcsRUFDSCxLQUFLLEVBQ0wsYUFBYSxFQUNiLEtBQUssRUFDTCxVQUFVLEdBQ1gsTUFBTSxNQUFNLENBQUM7QUFFZCxPQUFPLEVBQ0wsU0FBUyxFQUNULEdBQUcsRUFDSCxHQUFHLEVBQ0gsTUFBTSxFQUNOLFNBQVMsRUFDVCxvQkFBb0IsRUFDcEIsVUFBVSxFQUNWLFNBQVMsRUFDVCxRQUFRLEdBQ1QsTUFBTSxnQkFBZ0IsQ0FBQztBQUV4QixPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxlQUFlLENBQUM7Ozs7OztBQVFuRCxNQUFNLE9BQU8sV0FBVztJQWdFdEIsWUFDc0MsV0FBd0IsRUFDcEQsYUFBK0IsRUFDL0IsUUFBa0IsRUFDbEIsU0FBNEI7UUFIQSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQUNwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7UUFDL0IsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsQixjQUFTLEdBQVQsU0FBUyxDQUFtQjtRQW5FOUIsc0JBQWlCLEdBQUcsSUFBSSxlQUFlLENBQVUsSUFBSSxDQUFDLENBQUM7UUFDdkQsa0JBQWEsR0FBRyxJQUFJLGFBQWEsQ0FBUSxDQUFDLENBQUMsQ0FBQztRQUM1QyxrQkFBYSxHQUFHLElBQUksT0FBTyxFQUFRLENBQUM7UUFFNUMsdUNBQXVDO1FBQy9CLG1CQUFjLEdBQUcsSUFBSSxPQUFPLEVBQVEsQ0FBQztRQUM3Qzs7V0FFRztRQUNNLGVBQVUsR0FBRyxJQUFJLENBQUMsaUJBQWlC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SUFBSSxDQUNoRSxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTs7WUFDYixNQUFNLE1BQU0sZUFBRyxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsUUFBUSwwQ0FBRSxNQUFNLG1DQUFJLEdBQUcsQ0FBQztZQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQzs7c0VBOVJVLFdBQVcsY0FpRVosa0JBQWtCO21EQWpFakIsV0FBVyxXQUFYLFdBQVcsbUJBRlYsTUFBTTtrREFFUCxXQUFXO2NBSHZCLFVBQVU7ZUFBQztnQkFDVixVQUFVLEVBQUUsTUFBTTthQUNuQjs7c0JBa0VJLE1BQU07dUJBQUMsa0JBQWtCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSwgSW5qZWN0LCBPbkRlc3Ryb3kgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtcbiAgQXV0aDBDbGllbnQsXG4gIFJlZGlyZWN0TG9naW5PcHRpb25zLFxuICBQb3B1cExvZ2luT3B0aW9ucyxcbiAgUG9wdXBDb25maWdPcHRpb25zLFxuICBMb2dvdXRPcHRpb25zLFxuICBHZXRUb2tlblNpbGVudGx5T3B0aW9ucyxcbiAgR2V0VG9rZW5XaXRoUG9wdXBPcHRpb25zLFxuICBSZWRpcmVjdExvZ2luUmVzdWx0LFxufSBmcm9tICdAYXV0aDAvYXV0aDAtc3BhLWpzJztcblxuaW1wb3J0IHtcbiAgb2YsXG4gIGZyb20sXG4gIEJlaGF2aW9yU3ViamVjdCxcbiAgU3ViamVjdCxcbiAgT2JzZXJ2YWJsZSxcbiAgaWlmLFxuICBkZWZlcixcbiAgUmVwbGF5U3ViamVjdCxcbiAgbWVyZ2UsXG4gIHRocm93RXJyb3IsXG59IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge1xuICBjb25jYXRNYXAsXG4gIHRhcCxcbiAgbWFwLFxuICBmaWx0ZXIsXG4gIHRha2VVbnRpbCxcbiAgZGlzdGluY3RVbnRpbENoYW5nZWQsXG4gIGNhdGNoRXJyb3IsXG4gIHN3aXRjaE1hcCxcbiAgbWVyZ2VNYXAsXG59IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcblxuaW1wb3J0IHsgQXV0aDBDbGllbnRTZXJ2aWNlIH0gZnJvbSAnLi9hdXRoLmNsaWVudCc7XG5pbXBvcnQgeyBBYnN0cmFjdE5hdmlnYXRvciB9IGZyb20gJy4vYWJzdHJhY3QtbmF2aWdhdG9yJztcbmltcG9ydCB7IExvY2F0aW9uIH0gZnJvbSAnQGFuZ3VsYXIvY29tbW9uJztcbmltcG9ydCB7IEF1dGhDbGllbnRDb25maWcgfSBmcm9tICcuL2F1dGguY29uZmlnJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhTZXJ2aWNlIGltcGxlbWVudHMgT25EZXN0cm95IHtcbiAgcHJpdmF0ZSBpc0xvYWRpbmdTdWJqZWN0JCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4odHJ1ZSk7XG4gIHByaXZhdGUgZXJyb3JTdWJqZWN0JCA9IG5ldyBSZXBsYXlTdWJqZWN0PEVycm9yPigxKTtcbiAgcHJpdmF0ZSByZWZyZXNoU3RhdGUkID0gbmV3IFN1YmplY3Q8dm9pZD4oKTtcblxuICAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDExNzcxNjNcbiAgcHJpdmF0ZSBuZ1Vuc3Vic2NyaWJlJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG4gIC8qKlxuICAgKiBFbWl0cyBib29sZWFuIHZhbHVlcyBpbmRpY2F0aW5nIHRoZSBsb2FkaW5nIHN0YXRlIG9mIHRoZSBTREsuXG4gICAqL1xuICByZWFkb25seSBpc0xvYWRpbmckID0gdGhpcy5pc0xvYWRpbmdTdWJqZWN0JC5hc09ic2VydmFibGUoKTtcblxuICAvKipcbiAgICogVHJpZ2dlciB1c2VkIHRvIHB1bGwgVXNlciBpbmZvcm1hdGlvbiBmcm9tIHRoZSBBdXRoMENsaWVudC5cbiAgICogVHJpZ2dlcnMgd2hlbiBhbiBldmVudCBvY2N1cnMgdGhhdCBuZWVkcyB0byByZXRyaWdnZXIgdGhlIFVzZXIgUHJvZmlsZSBpbmZvcm1hdGlvbi5cbiAgICogU3VjaCBhczogSW5pdGlhbGx5LCBnZXRBY2Nlc3NUb2tlblNpbGVudGx5LCBnZXRBY2Nlc3NUb2tlbldpdGhQb3B1cCBhbmQgTG9nb3V0XG4gICAqL1xuICBwcml2YXRlIGlzQXV0aGVudGljYXRlZFRyaWdnZXIkID0gdGhpcy5pc0xvYWRpbmckLnBpcGUoXG4gICAgZmlsdGVyKChsb2FkaW5nKSA9PiAhbG9hZGluZyksXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICBzd2l0Y2hNYXAoKCkgPT5cbiAgICAgIC8vIFRvIHRyYWNrIHRoZSB2YWx1ZSBvZiBpc0F1dGhlbnRpY2F0ZWQgb3ZlciB0aW1lLCB3ZSBuZWVkIHRvIG1lcmdlOlxuICAgICAgLy8gIC0gdGhlIGN1cnJlbnQgdmFsdWVcbiAgICAgIC8vICAtIHRoZSB2YWx1ZSB3aGVuZXZlciByZWZyZXNoU3RhdGUkIGVtaXRzXG4gICAgICBtZXJnZShcbiAgICAgICAgZGVmZXIoKCkgPT4gdGhpcy5hdXRoMENsaWVudC5pc0F1dGhlbnRpY2F0ZWQoKSksXG4gICAgICAgIHRoaXMucmVmcmVzaFN0YXRlJC5waXBlKFxuICAgICAgICAgIG1lcmdlTWFwKCgpID0+IHRoaXMuYXV0aDBDbGllbnQuaXNBdXRoZW50aWNhdGVkKCkpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApXG4gICk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIGJvb2xlYW4gdmFsdWVzIGluZGljYXRpbmcgdGhlIGF1dGhlbnRpY2F0aW9uIHN0YXRlIG9mIHRoZSB1c2VyLiBJZiBgdHJ1ZWAsIGl0IG1lYW5zIGEgdXNlciBoYXMgYXV0aGVudGljYXRlZC5cbiAgICogVGhpcyBkZXBlbmRzIG9uIHRoZSB2YWx1ZSBvZiBgaXNMb2FkaW5nJGAsIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gbWFudWFsbHkgY2hlY2sgdGhlIGxvYWRpbmcgc3RhdGUgb2YgdGhlIFNESy5cbiAgICovXG4gIHJlYWRvbmx5IGlzQXV0aGVudGljYXRlZCQgPSB0aGlzLmlzQXV0aGVudGljYXRlZFRyaWdnZXIkLnBpcGUoXG4gICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICApO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBkZXRhaWxzIGFib3V0IHRoZSBhdXRoZW50aWNhdGVkIHVzZXIsIG9yIG51bGwgaWYgbm90IGF1dGhlbnRpY2F0ZWQuXG4gICAqL1xuICByZWFkb25seSB1c2VyJCA9IHRoaXMuaXNBdXRoZW50aWNhdGVkVHJpZ2dlciQucGlwZShcbiAgICBjb25jYXRNYXAoKGF1dGhlbnRpY2F0ZWQpID0+XG4gICAgICBhdXRoZW50aWNhdGVkID8gdGhpcy5hdXRoMENsaWVudC5nZXRVc2VyKCkgOiBvZihudWxsKVxuICAgIClcbiAgKTtcblxuICAvKipcbiAgICogRW1pdHMgSUQgdG9rZW4gY2xhaW1zIHdoZW4gYXV0aGVudGljYXRlZCwgb3IgbnVsbCBpZiBub3QgYXV0aGVudGljYXRlZC5cbiAgICovXG4gIHJlYWRvbmx5IGlkVG9rZW5DbGFpbXMkID0gdGhpcy5pc0F1dGhlbnRpY2F0ZWRUcmlnZ2VyJC5waXBlKFxuICAgIGNvbmNhdE1hcCgoYXV0aGVudGljYXRlZCkgPT5cbiAgICAgIGF1dGhlbnRpY2F0ZWQgPyB0aGlzLmF1dGgwQ2xpZW50LmdldElkVG9rZW5DbGFpbXMoKSA6IG9mKG51bGwpXG4gICAgKVxuICApO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBlcnJvcnMgdGhhdCBvY2N1ciBkdXJpbmcgbG9naW4sIG9yIHdoZW4gY2hlY2tpbmcgZm9yIGFuIGFjdGl2ZSBzZXNzaW9uIG9uIHN0YXJ0dXAuXG4gICAqL1xuICByZWFkb25seSBlcnJvciQgPSB0aGlzLmVycm9yU3ViamVjdCQuYXNPYnNlcnZhYmxlKCk7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgQEluamVjdChBdXRoMENsaWVudFNlcnZpY2UpIHByaXZhdGUgYXV0aDBDbGllbnQ6IEF1dGgwQ2xpZW50LFxuICAgIHByaXZhdGUgY29uZmlnRmFjdG9yeTogQXV0aENsaWVudENvbmZpZyxcbiAgICBwcml2YXRlIGxvY2F0aW9uOiBMb2NhdGlvbixcbiAgICBwcml2YXRlIG5hdmlnYXRvcjogQWJzdHJhY3ROYXZpZ2F0b3JcbiAgKSB7XG4gICAgY29uc3QgY2hlY2tTZXNzaW9uT3JDYWxsYmFjayQgPSAoaXNDYWxsYmFjazogYm9vbGVhbikgPT5cbiAgICAgIGlpZihcbiAgICAgICAgKCkgPT4gaXNDYWxsYmFjayxcbiAgICAgICAgdGhpcy5oYW5kbGVSZWRpcmVjdENhbGxiYWNrKCksXG4gICAgICAgIGRlZmVyKCgpID0+IHRoaXMuYXV0aDBDbGllbnQuY2hlY2tTZXNzaW9uKCkpXG4gICAgICApO1xuXG4gICAgdGhpcy5zaG91bGRIYW5kbGVDYWxsYmFjaygpXG4gICAgICAucGlwZShcbiAgICAgICAgc3dpdGNoTWFwKChpc0NhbGxiYWNrKSA9PlxuICAgICAgICAgIGNoZWNrU2Vzc2lvbk9yQ2FsbGJhY2skKGlzQ2FsbGJhY2spLnBpcGUoXG4gICAgICAgICAgICBjYXRjaEVycm9yKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ0ZhY3RvcnkuZ2V0KCk7XG4gICAgICAgICAgICAgIHRoaXMuZXJyb3JTdWJqZWN0JC5uZXh0KGVycm9yKTtcbiAgICAgICAgICAgICAgdGhpcy5uYXZpZ2F0b3IubmF2aWdhdGVCeVVybChjb25maWcuZXJyb3JQYXRoIHx8ICcvJyk7XG4gICAgICAgICAgICAgIHJldHVybiBvZih1bmRlZmluZWQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgICksXG4gICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5pc0xvYWRpbmdTdWJqZWN0JC5uZXh0KGZhbHNlKTtcbiAgICAgICAgfSksXG4gICAgICAgIHRha2VVbnRpbCh0aGlzLm5nVW5zdWJzY3JpYmUkKVxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIHRoZSBzZXJ2aWNlIGlzIGRlc3Ryb3llZFxuICAgKi9cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQxMTc3MTYzXG4gICAgdGhpcy5uZ1Vuc3Vic2NyaWJlJC5uZXh0KCk7XG4gICAgdGhpcy5uZ1Vuc3Vic2NyaWJlJC5jb21wbGV0ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGxvZ2luV2l0aFJlZGlyZWN0KG9wdGlvbnMpO1xuICAgKiBgYGBcbiAgICpcbiAgICogUGVyZm9ybXMgYSByZWRpcmVjdCB0byBgL2F1dGhvcml6ZWAgdXNpbmcgdGhlIHBhcmFtZXRlcnNcbiAgICogcHJvdmlkZWQgYXMgYXJndW1lbnRzLiBSYW5kb20gYW5kIHNlY3VyZSBgc3RhdGVgIGFuZCBgbm9uY2VgXG4gICAqIHBhcmFtZXRlcnMgd2lsbCBiZSBhdXRvLWdlbmVyYXRlZC5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIGxvZ2luIG9wdGlvbnNcbiAgICovXG4gIGxvZ2luV2l0aFJlZGlyZWN0KG9wdGlvbnM/OiBSZWRpcmVjdExvZ2luT3B0aW9ucyk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiBmcm9tKHRoaXMuYXV0aDBDbGllbnQubG9naW5XaXRoUmVkaXJlY3Qob3B0aW9ucykpO1xuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGF3YWl0IGxvZ2luV2l0aFBvcHVwKG9wdGlvbnMpO1xuICAgKiBgYGBcbiAgICpcbiAgICogT3BlbnMgYSBwb3B1cCB3aXRoIHRoZSBgL2F1dGhvcml6ZWAgVVJMIHVzaW5nIHRoZSBwYXJhbWV0ZXJzXG4gICAqIHByb3ZpZGVkIGFzIGFyZ3VtZW50cy4gUmFuZG9tIGFuZCBzZWN1cmUgYHN0YXRlYCBhbmQgYG5vbmNlYFxuICAgKiBwYXJhbWV0ZXJzIHdpbGwgYmUgYXV0by1nZW5lcmF0ZWQuIElmIHRoZSByZXNwb25zZSBpcyBzdWNjZXNzZnVsLFxuICAgKiByZXN1bHRzIHdpbGwgYmUgdmFsaWQgYWNjb3JkaW5nIHRvIHRoZWlyIGV4cGlyYXRpb24gdGltZXMuXG4gICAqXG4gICAqIElNUE9SVEFOVDogVGhpcyBtZXRob2QgaGFzIHRvIGJlIGNhbGxlZCBmcm9tIGFuIGV2ZW50IGhhbmRsZXJcbiAgICogdGhhdCB3YXMgc3RhcnRlZCBieSB0aGUgdXNlciBsaWtlIGEgYnV0dG9uIGNsaWNrLCBmb3IgZXhhbXBsZSxcbiAgICogb3RoZXJ3aXNlIHRoZSBwb3B1cCB3aWxsIGJlIGJsb2NrZWQgaW4gbW9zdCBicm93c2Vycy5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIGxvZ2luIG9wdGlvbnNcbiAgICogQHBhcmFtIGNvbmZpZyBDb25maWd1cmF0aW9uIGZvciB0aGUgcG9wdXAgd2luZG93XG4gICAqL1xuICBsb2dpbldpdGhQb3B1cChcbiAgICBvcHRpb25zPzogUG9wdXBMb2dpbk9wdGlvbnMsXG4gICAgY29uZmlnPzogUG9wdXBDb25maWdPcHRpb25zXG4gICk6IE9ic2VydmFibGU8dm9pZD4ge1xuICAgIHJldHVybiBmcm9tKFxuICAgICAgdGhpcy5hdXRoMENsaWVudC5sb2dpbldpdGhQb3B1cChvcHRpb25zLCBjb25maWcpLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGxvZ291dCgpO1xuICAgKiBgYGBcbiAgICpcbiAgICogQ2xlYXJzIHRoZSBhcHBsaWNhdGlvbiBzZXNzaW9uIGFuZCBwZXJmb3JtcyBhIHJlZGlyZWN0IHRvIGAvdjIvbG9nb3V0YCwgdXNpbmdcbiAgICogdGhlIHBhcmFtZXRlcnMgcHJvdmlkZWQgYXMgYXJndW1lbnRzLCB0byBjbGVhciB0aGUgQXV0aDAgc2Vzc2lvbi5cbiAgICogSWYgdGhlIGBmZWRlcmF0ZWRgIG9wdGlvbiBpcyBzcGVjaWZpZWQgaXQgYWxzbyBjbGVhcnMgdGhlIElkZW50aXR5IFByb3ZpZGVyIHNlc3Npb24uXG4gICAqIElmIHRoZSBgbG9jYWxPbmx5YCBvcHRpb24gaXMgc3BlY2lmaWVkLCBpdCBvbmx5IGNsZWFycyB0aGUgYXBwbGljYXRpb24gc2Vzc2lvbi5cbiAgICogSXQgaXMgaW52YWxpZCB0byBzZXQgYm90aCB0aGUgYGZlZGVyYXRlZGAgYW5kIGBsb2NhbE9ubHlgIG9wdGlvbnMgdG8gYHRydWVgLFxuICAgKiBhbmQgYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24gaWYgeW91IGRvLlxuICAgKiBbUmVhZCBtb3JlIGFib3V0IGhvdyBMb2dvdXQgd29ya3MgYXQgQXV0aDBdKGh0dHBzOi8vYXV0aDAuY29tL2RvY3MvbG9nb3V0KS5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIGxvZ291dCBvcHRpb25zXG4gICAqL1xuICBsb2dvdXQob3B0aW9ucz86IExvZ291dE9wdGlvbnMpOiB2b2lkIHtcbiAgICB0aGlzLmF1dGgwQ2xpZW50LmxvZ291dChvcHRpb25zKTtcblxuICAgIGlmIChvcHRpb25zPy5sb2NhbE9ubHkpIHtcbiAgICAgIHRoaXMucmVmcmVzaFN0YXRlJC5uZXh0KCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIGBgYGpzXG4gICAqIGdldEFjY2Vzc1Rva2VuU2lsZW50bHkob3B0aW9ucykuc3Vic2NyaWJlKHRva2VuID0+IC4uLilcbiAgICogYGBgXG4gICAqXG4gICAqIElmIHRoZXJlJ3MgYSB2YWxpZCB0b2tlbiBzdG9yZWQsIHJldHVybiBpdC4gT3RoZXJ3aXNlLCBvcGVucyBhblxuICAgKiBpZnJhbWUgd2l0aCB0aGUgYC9hdXRob3JpemVgIFVSTCB1c2luZyB0aGUgcGFyYW1ldGVycyBwcm92aWRlZFxuICAgKiBhcyBhcmd1bWVudHMuIFJhbmRvbSBhbmQgc2VjdXJlIGBzdGF0ZWAgYW5kIGBub25jZWAgcGFyYW1ldGVyc1xuICAgKiB3aWxsIGJlIGF1dG8tZ2VuZXJhdGVkLiBJZiB0aGUgcmVzcG9uc2UgaXMgc3VjY2Vzc2Z1bCwgcmVzdWx0c1xuICAgKiB3aWxsIGJlIHZhbGlkIGFjY29yZGluZyB0byB0aGVpciBleHBpcmF0aW9uIHRpbWVzLlxuICAgKlxuICAgKiBJZiByZWZyZXNoIHRva2VucyBhcmUgdXNlZCwgdGhlIHRva2VuIGVuZHBvaW50IGlzIGNhbGxlZCBkaXJlY3RseSB3aXRoIHRoZVxuICAgKiAncmVmcmVzaF90b2tlbicgZ3JhbnQuIElmIG5vIHJlZnJlc2ggdG9rZW4gaXMgYXZhaWxhYmxlIHRvIG1ha2UgdGhpcyBjYWxsLFxuICAgKiB0aGUgU0RLIGZhbGxzIGJhY2sgdG8gdXNpbmcgYW4gaWZyYW1lIHRvIHRoZSAnL2F1dGhvcml6ZScgVVJMLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBtYXkgdXNlIGEgd2ViIHdvcmtlciB0byBwZXJmb3JtIHRoZSB0b2tlbiBjYWxsIGlmIHRoZSBpbi1tZW1vcnlcbiAgICogY2FjaGUgaXMgdXNlZC5cbiAgICpcbiAgICogSWYgYW4gYGF1ZGllbmNlYCB2YWx1ZSBpcyBnaXZlbiB0byB0aGlzIGZ1bmN0aW9uLCB0aGUgU0RLIGFsd2F5cyBmYWxsc1xuICAgKiBiYWNrIHRvIHVzaW5nIGFuIGlmcmFtZSB0byBtYWtlIHRoZSB0b2tlbiBleGNoYW5nZS5cbiAgICpcbiAgICogTm90ZSB0aGF0IGluIGFsbCBjYXNlcywgZmFsbGluZyBiYWNrIHRvIGFuIGlmcmFtZSByZXF1aXJlcyBhY2Nlc3MgdG9cbiAgICogdGhlIGBhdXRoMGAgY29va2llLCBhbmQgdGh1cyB3aWxsIG5vdCB3b3JrIGluIGJyb3dzZXJzIHRoYXQgYmxvY2sgdGhpcmQtcGFydHlcbiAgICogY29va2llcyBieSBkZWZhdWx0IChTYWZhcmksIEJyYXZlLCBldGMpLlxuICAgKlxuICAgKiBAcGFyYW0gb3B0aW9ucyBUaGUgb3B0aW9ucyBmb3IgY29uZmlndXJpbmcgdGhlIHRva2VuIGZldGNoLlxuICAgKi9cbiAgZ2V0QWNjZXNzVG9rZW5TaWxlbnRseShcbiAgICBvcHRpb25zPzogR2V0VG9rZW5TaWxlbnRseU9wdGlvbnNcbiAgKTogT2JzZXJ2YWJsZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gb2YodGhpcy5hdXRoMENsaWVudCkucGlwZShcbiAgICAgIGNvbmNhdE1hcCgoY2xpZW50KSA9PiBjbGllbnQuZ2V0VG9rZW5TaWxlbnRseShvcHRpb25zKSksXG4gICAgICB0YXAoKCkgPT4gdGhpcy5yZWZyZXNoU3RhdGUkLm5leHQoKSksXG4gICAgICBjYXRjaEVycm9yKChlcnJvcikgPT4ge1xuICAgICAgICB0aGlzLmVycm9yU3ViamVjdCQubmV4dChlcnJvcik7XG4gICAgICAgIHRoaXMucmVmcmVzaFN0YXRlJC5uZXh0KCk7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKGVycm9yKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBnZXRUb2tlbldpdGhQb3B1cChvcHRpb25zKS5zdWJzY3JpYmUodG9rZW4gPT4gLi4uKVxuICAgKiBgYGBcbiAgICpcbiAgICogR2V0IGFuIGFjY2VzcyB0b2tlbiBpbnRlcmFjdGl2ZWx5LlxuICAgKlxuICAgKiBPcGVucyBhIHBvcHVwIHdpdGggdGhlIGAvYXV0aG9yaXplYCBVUkwgdXNpbmcgdGhlIHBhcmFtZXRlcnNcbiAgICogcHJvdmlkZWQgYXMgYXJndW1lbnRzLiBSYW5kb20gYW5kIHNlY3VyZSBgc3RhdGVgIGFuZCBgbm9uY2VgXG4gICAqIHBhcmFtZXRlcnMgd2lsbCBiZSBhdXRvLWdlbmVyYXRlZC4gSWYgdGhlIHJlc3BvbnNlIGlzIHN1Y2Nlc3NmdWwsXG4gICAqIHJlc3VsdHMgd2lsbCBiZSB2YWxpZCBhY2NvcmRpbmcgdG8gdGhlaXIgZXhwaXJhdGlvbiB0aW1lcy5cbiAgICovXG4gIGdldEFjY2Vzc1Rva2VuV2l0aFBvcHVwKFxuICAgIG9wdGlvbnM/OiBHZXRUb2tlbldpdGhQb3B1cE9wdGlvbnNcbiAgKTogT2JzZXJ2YWJsZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gb2YodGhpcy5hdXRoMENsaWVudCkucGlwZShcbiAgICAgIGNvbmNhdE1hcCgoY2xpZW50KSA9PiBjbGllbnQuZ2V0VG9rZW5XaXRoUG9wdXAob3B0aW9ucykpLFxuICAgICAgdGFwKCgpID0+IHRoaXMucmVmcmVzaFN0YXRlJC5uZXh0KCkpLFxuICAgICAgY2F0Y2hFcnJvcigoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5lcnJvclN1YmplY3QkLm5leHQoZXJyb3IpO1xuICAgICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBhdXRoMEhhbmRsZUNhbGxiYWNrKHVybD86IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChcbiAgICAgICh1cmw/LmluY2x1ZGVzKCdjb2RlPScpIHx8IHVybD8uaW5jbHVkZXMoJ2Vycm9yPScpKSAmJlxuICAgICAgdXJsPy5pbmNsdWRlcygnc3RhdGU9JylcbiAgICApIHtcbiAgICAgIGZyb20odGhpcy5hdXRoMENsaWVudC5oYW5kbGVSZWRpcmVjdENhbGxiYWNrKHVybCkpXG4gICAgICAgIC5waXBlKFxuICAgICAgICAgIG1hcCgocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdGFyZ2V0ID0gJy8nO1xuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICBpZiAocmVzdWx0LmFwcFN0YXRlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5hcHBTdGF0ZS50YXJnZXQpIHtcbiAgICAgICAgICAgICAgICAgIHRhcmdldCA9IHJlc3VsdC5hcHBTdGF0ZS50YXJnZXQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLm5hdmlnYXRvci5uYXZpZ2F0ZUJ5VXJsKHRhcmdldCk7XG4gICAgICAgICAgfSksXG4gICAgICAgICAgdGFwKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaFN0YXRlJC5uZXh0KCk7XG4gICAgICAgICAgICB0aGlzLmlzTG9hZGluZ1N1YmplY3QkLm5leHQoZmFsc2UpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRha2VVbnRpbCh0aGlzLm5nVW5zdWJzY3JpYmUkKVxuICAgICAgICApXG4gICAgICAgIC5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZEhhbmRsZUNhbGxiYWNrKCk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBvZih0aGlzLmxvY2F0aW9uLnBhdGgoKSkucGlwZShcbiAgICAgIG1hcCgoc2VhcmNoKSA9PiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgKHNlYXJjaC5pbmNsdWRlcygnY29kZT0nKSB8fCBzZWFyY2guaW5jbHVkZXMoJ2Vycm9yPScpKSAmJlxuICAgICAgICAgIHNlYXJjaC5pbmNsdWRlcygnc3RhdGU9JykgJiZcbiAgICAgICAgICAhdGhpcy5jb25maWdGYWN0b3J5LmdldCgpLnNraXBSZWRpcmVjdENhbGxiYWNrXG4gICAgICAgICk7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIGhhbmRsZVJlZGlyZWN0Q2FsbGJhY2soKTogT2JzZXJ2YWJsZTxSZWRpcmVjdExvZ2luUmVzdWx0PiB7XG4gICAgcmV0dXJuIGRlZmVyKCgpID0+IHRoaXMuYXV0aDBDbGllbnQuaGFuZGxlUmVkaXJlY3RDYWxsYmFjaygpKS5waXBlKFxuICAgICAgdGFwKChyZXN1bHQpID0+IHtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gcmVzdWx0Py5hcHBTdGF0ZT8udGFyZ2V0ID8/ICcvJztcbiAgICAgICAgdGhpcy5uYXZpZ2F0b3IubmF2aWdhdGVCeVVybCh0YXJnZXQpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG59XG4iXX0=
