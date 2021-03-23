import { Injectable, Inject } from '@angular/core';
import { Auth0Client } from '@auth0/auth0-spa-js';
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
import { AbstractNavigator } from './abstract-navigator';
import { Location } from '@angular/common';
import { AuthClientConfig } from './auth.config';
import * as i0 from '@angular/core';
import * as i1 from './auth.client';
import * as i2 from './auth.config';
import * as i3 from '@angular/common';
import * as i4 from './abstract-navigator';
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
AuthService.ɵprov = i0.ɵɵdefineInjectable({
  factory: function AuthService_Factory() {
    return new AuthService(
      i0.ɵɵinject(i1.Auth0ClientService),
      i0.ɵɵinject(i2.AuthClientConfig),
      i0.ɵɵinject(i3.Location),
      i0.ɵɵinject(i4.AbstractNavigator)
    );
  },
  token: AuthService,
  providedIn: 'root',
});
AuthService.decorators = [
  {
    type: Injectable,
    args: [
      {
        providedIn: 'root',
      },
    ],
  },
];
AuthService.ctorParameters = () => [
  {
    type: Auth0Client,
    decorators: [{ type: Inject, args: [Auth0ClientService] }],
  },
  { type: AuthClientConfig },
  { type: Location },
  { type: AbstractNavigator },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL3Byb2plY3RzL2F1dGgwLWFuZ3VsYXIvc3JjLyIsInNvdXJjZXMiOlsibGliL2F1dGguc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBYSxNQUFNLGVBQWUsQ0FBQztBQUU5RCxPQUFPLEVBQ0wsV0FBVyxHQVFaLE1BQU0scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUNMLEVBQUUsRUFDRixJQUFJLEVBQ0osZUFBZSxFQUNmLE9BQU8sRUFFUCxHQUFHLEVBQ0gsS0FBSyxFQUNMLGFBQWEsRUFDYixLQUFLLEVBQ0wsVUFBVSxHQUNYLE1BQU0sTUFBTSxDQUFDO0FBRWQsT0FBTyxFQUNMLFNBQVMsRUFDVCxHQUFHLEVBQ0gsR0FBRyxFQUNILE1BQU0sRUFDTixTQUFTLEVBQ1Qsb0JBQW9CLEVBQ3BCLFVBQVUsRUFDVixTQUFTLEVBQ1QsUUFBUSxHQUNULE1BQU0sZ0JBQWdCLENBQUM7QUFFeEIsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ25ELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3pELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMzQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxlQUFlLENBQUM7Ozs7OztBQUtqRCxNQUFNLE9BQU8sV0FBVztJQWdFdEIsWUFDc0MsV0FBd0IsRUFDcEQsYUFBK0IsRUFDL0IsUUFBa0IsRUFDbEIsU0FBNEI7UUFIQSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQUNwRCxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7UUFDL0IsYUFBUSxHQUFSLFFBQVEsQ0FBVTtRQUNsQixjQUFTLEdBQVQsU0FBUyxDQUFtQjtRQW5FOUIsc0JBQWlCLEdBQUcsSUFBSSxlQUFlLENBQVUsSUFBSSxDQUFDLENBQUM7UUFD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LENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDLG9CQUFvQixDQUMvQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7SUFFTyxzQkFBc0I7UUFDNUIsT0FBTyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUNoRSxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTs7WUFDYixNQUFNLE1BQU0sZUFBRyxNQUFNLGFBQU4sTUFBTSx1QkFBTixNQUFNLENBQUUsUUFBUSwwQ0FBRSxNQUFNLG1DQUFJLEdBQUcsQ0FBQztZQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2QyxDQUFDLENBQUMsQ0FDSCxDQUFDO0lBQ0osQ0FBQzs7OztZQWpTRixVQUFVLFNBQUM7Z0JBQ1YsVUFBVSxFQUFFLE1BQU07YUFDbkI7OztZQTFDQyxXQUFXLHVCQTRHUixNQUFNLFNBQUMsa0JBQWtCO1lBdEVyQixnQkFBZ0I7WUFEaEIsUUFBUTtZQURSLGlCQUFpQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIEluamVjdCwgT25EZXN0cm95IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5cbmltcG9ydCB7XG4gIEF1dGgwQ2xpZW50LFxuICBSZWRpcmVjdExvZ2luT3B0aW9ucyxcbiAgUG9wdXBMb2dpbk9wdGlvbnMsXG4gIFBvcHVwQ29uZmlnT3B0aW9ucyxcbiAgTG9nb3V0T3B0aW9ucyxcbiAgR2V0VG9rZW5TaWxlbnRseU9wdGlvbnMsXG4gIEdldFRva2VuV2l0aFBvcHVwT3B0aW9ucyxcbiAgUmVkaXJlY3RMb2dpblJlc3VsdCxcbn0gZnJvbSAnQGF1dGgwL2F1dGgwLXNwYS1qcyc7XG5cbmltcG9ydCB7XG4gIG9mLFxuICBmcm9tLFxuICBCZWhhdmlvclN1YmplY3QsXG4gIFN1YmplY3QsXG4gIE9ic2VydmFibGUsXG4gIGlpZixcbiAgZGVmZXIsXG4gIFJlcGxheVN1YmplY3QsXG4gIG1lcmdlLFxuICB0aHJvd0Vycm9yLFxufSBmcm9tICdyeGpzJztcblxuaW1wb3J0IHtcbiAgY29uY2F0TWFwLFxuICB0YXAsXG4gIG1hcCxcbiAgZmlsdGVyLFxuICB0YWtlVW50aWwsXG4gIGRpc3RpbmN0VW50aWxDaGFuZ2VkLFxuICBjYXRjaEVycm9yLFxuICBzd2l0Y2hNYXAsXG4gIG1lcmdlTWFwLFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cbmltcG9ydCB7IEF1dGgwQ2xpZW50U2VydmljZSB9IGZyb20gJy4vYXV0aC5jbGllbnQnO1xuaW1wb3J0IHsgQWJzdHJhY3ROYXZpZ2F0b3IgfSBmcm9tICcuL2Fic3RyYWN0LW5hdmlnYXRvcic7XG5pbXBvcnQgeyBMb2NhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBBdXRoQ2xpZW50Q29uZmlnIH0gZnJvbSAnLi9hdXRoLmNvbmZpZyc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBBdXRoU2VydmljZSBpbXBsZW1lbnRzIE9uRGVzdHJveSB7XG4gIHByaXZhdGUgaXNMb2FkaW5nU3ViamVjdCQgPSBuZXcgQmVoYXZpb3JTdWJqZWN0PGJvb2xlYW4+KHRydWUpO1xuICBwcml2YXRlIGVycm9yU3ViamVjdCQgPSBuZXcgUmVwbGF5U3ViamVjdDxFcnJvcj4oMSk7XG4gIHByaXZhdGUgcmVmcmVzaFN0YXRlJCA9IG5ldyBTdWJqZWN0PHZvaWQ+KCk7XG5cbiAgLy8gaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQxMTc3MTYzXG4gIHByaXZhdGUgbmdVbnN1YnNjcmliZSQgPSBuZXcgU3ViamVjdDx2b2lkPigpO1xuICAvKipcbiAgICogRW1pdHMgYm9vbGVhbiB2YWx1ZXMgaW5kaWNhdGluZyB0aGUgbG9hZGluZyBzdGF0ZSBvZiB0aGUgU0RLLlxuICAgKi9cbiAgcmVhZG9ubHkgaXNMb2FkaW5nJCA9IHRoaXMuaXNMb2FkaW5nU3ViamVjdCQuYXNPYnNlcnZhYmxlKCk7XG5cbiAgLyoqXG4gICAqIFRyaWdnZXIgdXNlZCB0byBwdWxsIFVzZXIgaW5mb3JtYXRpb24gZnJvbSB0aGUgQXV0aDBDbGllbnQuXG4gICAqIFRyaWdnZXJzIHdoZW4gYW4gZXZlbnQgb2NjdXJzIHRoYXQgbmVlZHMgdG8gcmV0cmlnZ2VyIHRoZSBVc2VyIFByb2ZpbGUgaW5mb3JtYXRpb24uXG4gICAqIFN1Y2ggYXM6IEluaXRpYWxseSwgZ2V0QWNjZXNzVG9rZW5TaWxlbnRseSwgZ2V0QWNjZXNzVG9rZW5XaXRoUG9wdXAgYW5kIExvZ291dFxuICAgKi9cbiAgcHJpdmF0ZSBpc0F1dGhlbnRpY2F0ZWRUcmlnZ2VyJCA9IHRoaXMuaXNMb2FkaW5nJC5waXBlKFxuICAgIGZpbHRlcigobG9hZGluZykgPT4gIWxvYWRpbmcpLFxuICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgc3dpdGNoTWFwKCgpID0+XG4gICAgICAvLyBUbyB0cmFjayB0aGUgdmFsdWUgb2YgaXNBdXRoZW50aWNhdGVkIG92ZXIgdGltZSwgd2UgbmVlZCB0byBtZXJnZTpcbiAgICAgIC8vICAtIHRoZSBjdXJyZW50IHZhbHVlXG4gICAgICAvLyAgLSB0aGUgdmFsdWUgd2hlbmV2ZXIgcmVmcmVzaFN0YXRlJCBlbWl0c1xuICAgICAgbWVyZ2UoXG4gICAgICAgIGRlZmVyKCgpID0+IHRoaXMuYXV0aDBDbGllbnQuaXNBdXRoZW50aWNhdGVkKCkpLFxuICAgICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQucGlwZShcbiAgICAgICAgICBtZXJnZU1hcCgoKSA9PiB0aGlzLmF1dGgwQ2xpZW50LmlzQXV0aGVudGljYXRlZCgpKVxuICAgICAgICApXG4gICAgICApXG4gICAgKVxuICApO1xuXG4gIC8qKlxuICAgKiBFbWl0cyBib29sZWFuIHZhbHVlcyBpbmRpY2F0aW5nIHRoZSBhdXRoZW50aWNhdGlvbiBzdGF0ZSBvZiB0aGUgdXNlci4gSWYgYHRydWVgLCBpdCBtZWFucyBhIHVzZXIgaGFzIGF1dGhlbnRpY2F0ZWQuXG4gICAqIFRoaXMgZGVwZW5kcyBvbiB0aGUgdmFsdWUgb2YgYGlzTG9hZGluZyRgLCBzbyB0aGVyZSBpcyBubyBuZWVkIHRvIG1hbnVhbGx5IGNoZWNrIHRoZSBsb2FkaW5nIHN0YXRlIG9mIHRoZSBTREsuXG4gICAqL1xuICByZWFkb25seSBpc0F1dGhlbnRpY2F0ZWQkID0gdGhpcy5pc0F1dGhlbnRpY2F0ZWRUcmlnZ2VyJC5waXBlKFxuICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgKTtcblxuICAvKipcbiAgICogRW1pdHMgZGV0YWlscyBhYm91dCB0aGUgYXV0aGVudGljYXRlZCB1c2VyLCBvciBudWxsIGlmIG5vdCBhdXRoZW50aWNhdGVkLlxuICAgKi9cbiAgcmVhZG9ubHkgdXNlciQgPSB0aGlzLmlzQXV0aGVudGljYXRlZFRyaWdnZXIkLnBpcGUoXG4gICAgY29uY2F0TWFwKChhdXRoZW50aWNhdGVkKSA9PlxuICAgICAgYXV0aGVudGljYXRlZCA/IHRoaXMuYXV0aDBDbGllbnQuZ2V0VXNlcigpIDogb2YobnVsbClcbiAgICApXG4gICk7XG5cbiAgLyoqXG4gICAqIEVtaXRzIElEIHRva2VuIGNsYWltcyB3aGVuIGF1dGhlbnRpY2F0ZWQsIG9yIG51bGwgaWYgbm90IGF1dGhlbnRpY2F0ZWQuXG4gICAqL1xuICByZWFkb25seSBpZFRva2VuQ2xhaW1zJCA9IHRoaXMuaXNBdXRoZW50aWNhdGVkVHJpZ2dlciQucGlwZShcbiAgICBjb25jYXRNYXAoKGF1dGhlbnRpY2F0ZWQpID0+XG4gICAgICBhdXRoZW50aWNhdGVkID8gdGhpcy5hdXRoMENsaWVudC5nZXRJZFRva2VuQ2xhaW1zKCkgOiBvZihudWxsKVxuICAgIClcbiAgKTtcblxuICAvKipcbiAgICogRW1pdHMgZXJyb3JzIHRoYXQgb2NjdXIgZHVyaW5nIGxvZ2luLCBvciB3aGVuIGNoZWNraW5nIGZvciBhbiBhY3RpdmUgc2Vzc2lvbiBvbiBzdGFydHVwLlxuICAgKi9cbiAgcmVhZG9ubHkgZXJyb3IkID0gdGhpcy5lcnJvclN1YmplY3QkLmFzT2JzZXJ2YWJsZSgpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIEBJbmplY3QoQXV0aDBDbGllbnRTZXJ2aWNlKSBwcml2YXRlIGF1dGgwQ2xpZW50OiBBdXRoMENsaWVudCxcbiAgICBwcml2YXRlIGNvbmZpZ0ZhY3Rvcnk6IEF1dGhDbGllbnRDb25maWcsXG4gICAgcHJpdmF0ZSBsb2NhdGlvbjogTG9jYXRpb24sXG4gICAgcHJpdmF0ZSBuYXZpZ2F0b3I6IEFic3RyYWN0TmF2aWdhdG9yXG4gICkge1xuICAgIGNvbnN0IGNoZWNrU2Vzc2lvbk9yQ2FsbGJhY2skID0gKGlzQ2FsbGJhY2s6IGJvb2xlYW4pID0+XG4gICAgICBpaWYoXG4gICAgICAgICgpID0+IGlzQ2FsbGJhY2ssXG4gICAgICAgIHRoaXMuaGFuZGxlUmVkaXJlY3RDYWxsYmFjaygpLFxuICAgICAgICBkZWZlcigoKSA9PiB0aGlzLmF1dGgwQ2xpZW50LmNoZWNrU2Vzc2lvbigpKVxuICAgICAgKTtcblxuICAgIHRoaXMuc2hvdWxkSGFuZGxlQ2FsbGJhY2soKVxuICAgICAgLnBpcGUoXG4gICAgICAgIHN3aXRjaE1hcCgoaXNDYWxsYmFjaykgPT5cbiAgICAgICAgICBjaGVja1Nlc3Npb25PckNhbGxiYWNrJChpc0NhbGxiYWNrKS5waXBlKFxuICAgICAgICAgICAgY2F0Y2hFcnJvcigoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdGYWN0b3J5LmdldCgpO1xuICAgICAgICAgICAgICB0aGlzLmVycm9yU3ViamVjdCQubmV4dChlcnJvcik7XG4gICAgICAgICAgICAgIHRoaXMubmF2aWdhdG9yLm5hdmlnYXRlQnlVcmwoY29uZmlnLmVycm9yUGF0aCB8fCAnLycpO1xuICAgICAgICAgICAgICByZXR1cm4gb2YodW5kZWZpbmVkKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICB0YXAoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuaXNMb2FkaW5nU3ViamVjdCQubmV4dChmYWxzZSk7XG4gICAgICAgIH0pLFxuICAgICAgICB0YWtlVW50aWwodGhpcy5uZ1Vuc3Vic2NyaWJlJClcbiAgICAgIClcbiAgICAgIC5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgc2VydmljZSBpcyBkZXN0cm95ZWRcbiAgICovXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIC8vIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80MTE3NzE2M1xuICAgIHRoaXMubmdVbnN1YnNjcmliZSQubmV4dCgpO1xuICAgIHRoaXMubmdVbnN1YnNjcmliZSQuY29tcGxldGUoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBsb2dpbldpdGhSZWRpcmVjdChvcHRpb25zKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFBlcmZvcm1zIGEgcmVkaXJlY3QgdG8gYC9hdXRob3JpemVgIHVzaW5nIHRoZSBwYXJhbWV0ZXJzXG4gICAqIHByb3ZpZGVkIGFzIGFyZ3VtZW50cy4gUmFuZG9tIGFuZCBzZWN1cmUgYHN0YXRlYCBhbmQgYG5vbmNlYFxuICAgKiBwYXJhbWV0ZXJzIHdpbGwgYmUgYXV0by1nZW5lcmF0ZWQuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBsb2dpbiBvcHRpb25zXG4gICAqL1xuICBsb2dpbldpdGhSZWRpcmVjdChvcHRpb25zPzogUmVkaXJlY3RMb2dpbk9wdGlvbnMpOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gZnJvbSh0aGlzLmF1dGgwQ2xpZW50LmxvZ2luV2l0aFJlZGlyZWN0KG9wdGlvbnMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBhd2FpdCBsb2dpbldpdGhQb3B1cChvcHRpb25zKTtcbiAgICogYGBgXG4gICAqXG4gICAqIE9wZW5zIGEgcG9wdXAgd2l0aCB0aGUgYC9hdXRob3JpemVgIFVSTCB1c2luZyB0aGUgcGFyYW1ldGVyc1xuICAgKiBwcm92aWRlZCBhcyBhcmd1bWVudHMuIFJhbmRvbSBhbmQgc2VjdXJlIGBzdGF0ZWAgYW5kIGBub25jZWBcbiAgICogcGFyYW1ldGVycyB3aWxsIGJlIGF1dG8tZ2VuZXJhdGVkLiBJZiB0aGUgcmVzcG9uc2UgaXMgc3VjY2Vzc2Z1bCxcbiAgICogcmVzdWx0cyB3aWxsIGJlIHZhbGlkIGFjY29yZGluZyB0byB0aGVpciBleHBpcmF0aW9uIHRpbWVzLlxuICAgKlxuICAgKiBJTVBPUlRBTlQ6IFRoaXMgbWV0aG9kIGhhcyB0byBiZSBjYWxsZWQgZnJvbSBhbiBldmVudCBoYW5kbGVyXG4gICAqIHRoYXQgd2FzIHN0YXJ0ZWQgYnkgdGhlIHVzZXIgbGlrZSBhIGJ1dHRvbiBjbGljaywgZm9yIGV4YW1wbGUsXG4gICAqIG90aGVyd2lzZSB0aGUgcG9wdXAgd2lsbCBiZSBibG9ja2VkIGluIG1vc3QgYnJvd3NlcnMuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBsb2dpbiBvcHRpb25zXG4gICAqIEBwYXJhbSBjb25maWcgQ29uZmlndXJhdGlvbiBmb3IgdGhlIHBvcHVwIHdpbmRvd1xuICAgKi9cbiAgbG9naW5XaXRoUG9wdXAoXG4gICAgb3B0aW9ucz86IFBvcHVwTG9naW5PcHRpb25zLFxuICAgIGNvbmZpZz86IFBvcHVwQ29uZmlnT3B0aW9uc1xuICApOiBPYnNlcnZhYmxlPHZvaWQ+IHtcbiAgICByZXR1cm4gZnJvbShcbiAgICAgIHRoaXMuYXV0aDBDbGllbnQubG9naW5XaXRoUG9wdXAob3B0aW9ucywgY29uZmlnKS50aGVuKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZWZyZXNoU3RhdGUkLm5leHQoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBsb2dvdXQoKTtcbiAgICogYGBgXG4gICAqXG4gICAqIENsZWFycyB0aGUgYXBwbGljYXRpb24gc2Vzc2lvbiBhbmQgcGVyZm9ybXMgYSByZWRpcmVjdCB0byBgL3YyL2xvZ291dGAsIHVzaW5nXG4gICAqIHRoZSBwYXJhbWV0ZXJzIHByb3ZpZGVkIGFzIGFyZ3VtZW50cywgdG8gY2xlYXIgdGhlIEF1dGgwIHNlc3Npb24uXG4gICAqIElmIHRoZSBgZmVkZXJhdGVkYCBvcHRpb24gaXMgc3BlY2lmaWVkIGl0IGFsc28gY2xlYXJzIHRoZSBJZGVudGl0eSBQcm92aWRlciBzZXNzaW9uLlxuICAgKiBJZiB0aGUgYGxvY2FsT25seWAgb3B0aW9uIGlzIHNwZWNpZmllZCwgaXQgb25seSBjbGVhcnMgdGhlIGFwcGxpY2F0aW9uIHNlc3Npb24uXG4gICAqIEl0IGlzIGludmFsaWQgdG8gc2V0IGJvdGggdGhlIGBmZWRlcmF0ZWRgIGFuZCBgbG9jYWxPbmx5YCBvcHRpb25zIHRvIGB0cnVlYCxcbiAgICogYW5kIGFuIGVycm9yIHdpbGwgYmUgdGhyb3duIGlmIHlvdSBkby5cbiAgICogW1JlYWQgbW9yZSBhYm91dCBob3cgTG9nb3V0IHdvcmtzIGF0IEF1dGgwXShodHRwczovL2F1dGgwLmNvbS9kb2NzL2xvZ291dCkuXG4gICAqXG4gICAqIEBwYXJhbSBvcHRpb25zIFRoZSBsb2dvdXQgb3B0aW9uc1xuICAgKi9cbiAgbG9nb3V0KG9wdGlvbnM/OiBMb2dvdXRPcHRpb25zKTogdm9pZCB7XG4gICAgdGhpcy5hdXRoMENsaWVudC5sb2dvdXQob3B0aW9ucyk7XG5cbiAgICBpZiAob3B0aW9ucz8ubG9jYWxPbmx5KSB7XG4gICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBgYGBqc1xuICAgKiBnZXRBY2Nlc3NUb2tlblNpbGVudGx5KG9wdGlvbnMpLnN1YnNjcmliZSh0b2tlbiA9PiAuLi4pXG4gICAqIGBgYFxuICAgKlxuICAgKiBJZiB0aGVyZSdzIGEgdmFsaWQgdG9rZW4gc3RvcmVkLCByZXR1cm4gaXQuIE90aGVyd2lzZSwgb3BlbnMgYW5cbiAgICogaWZyYW1lIHdpdGggdGhlIGAvYXV0aG9yaXplYCBVUkwgdXNpbmcgdGhlIHBhcmFtZXRlcnMgcHJvdmlkZWRcbiAgICogYXMgYXJndW1lbnRzLiBSYW5kb20gYW5kIHNlY3VyZSBgc3RhdGVgIGFuZCBgbm9uY2VgIHBhcmFtZXRlcnNcbiAgICogd2lsbCBiZSBhdXRvLWdlbmVyYXRlZC4gSWYgdGhlIHJlc3BvbnNlIGlzIHN1Y2Nlc3NmdWwsIHJlc3VsdHNcbiAgICogd2lsbCBiZSB2YWxpZCBhY2NvcmRpbmcgdG8gdGhlaXIgZXhwaXJhdGlvbiB0aW1lcy5cbiAgICpcbiAgICogSWYgcmVmcmVzaCB0b2tlbnMgYXJlIHVzZWQsIHRoZSB0b2tlbiBlbmRwb2ludCBpcyBjYWxsZWQgZGlyZWN0bHkgd2l0aCB0aGVcbiAgICogJ3JlZnJlc2hfdG9rZW4nIGdyYW50LiBJZiBubyByZWZyZXNoIHRva2VuIGlzIGF2YWlsYWJsZSB0byBtYWtlIHRoaXMgY2FsbCxcbiAgICogdGhlIFNESyBmYWxscyBiYWNrIHRvIHVzaW5nIGFuIGlmcmFtZSB0byB0aGUgJy9hdXRob3JpemUnIFVSTC5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgbWF5IHVzZSBhIHdlYiB3b3JrZXIgdG8gcGVyZm9ybSB0aGUgdG9rZW4gY2FsbCBpZiB0aGUgaW4tbWVtb3J5XG4gICAqIGNhY2hlIGlzIHVzZWQuXG4gICAqXG4gICAqIElmIGFuIGBhdWRpZW5jZWAgdmFsdWUgaXMgZ2l2ZW4gdG8gdGhpcyBmdW5jdGlvbiwgdGhlIFNESyBhbHdheXMgZmFsbHNcbiAgICogYmFjayB0byB1c2luZyBhbiBpZnJhbWUgdG8gbWFrZSB0aGUgdG9rZW4gZXhjaGFuZ2UuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBpbiBhbGwgY2FzZXMsIGZhbGxpbmcgYmFjayB0byBhbiBpZnJhbWUgcmVxdWlyZXMgYWNjZXNzIHRvXG4gICAqIHRoZSBgYXV0aDBgIGNvb2tpZSwgYW5kIHRodXMgd2lsbCBub3Qgd29yayBpbiBicm93c2VycyB0aGF0IGJsb2NrIHRoaXJkLXBhcnR5XG4gICAqIGNvb2tpZXMgYnkgZGVmYXVsdCAoU2FmYXJpLCBCcmF2ZSwgZXRjKS5cbiAgICpcbiAgICogQHBhcmFtIG9wdGlvbnMgVGhlIG9wdGlvbnMgZm9yIGNvbmZpZ3VyaW5nIHRoZSB0b2tlbiBmZXRjaC5cbiAgICovXG4gIGdldEFjY2Vzc1Rva2VuU2lsZW50bHkoXG4gICAgb3B0aW9ucz86IEdldFRva2VuU2lsZW50bHlPcHRpb25zXG4gICk6IE9ic2VydmFibGU8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG9mKHRoaXMuYXV0aDBDbGllbnQpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKGNsaWVudCkgPT4gY2xpZW50LmdldFRva2VuU2lsZW50bHkob3B0aW9ucykpLFxuICAgICAgdGFwKCgpID0+IHRoaXMucmVmcmVzaFN0YXRlJC5uZXh0KCkpLFxuICAgICAgY2F0Y2hFcnJvcigoZXJyb3IpID0+IHtcbiAgICAgICAgdGhpcy5lcnJvclN1YmplY3QkLm5leHQoZXJyb3IpO1xuICAgICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpO1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnJvcik7XG4gICAgICB9KVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogYGBganNcbiAgICogZ2V0VG9rZW5XaXRoUG9wdXAob3B0aW9ucykuc3Vic2NyaWJlKHRva2VuID0+IC4uLilcbiAgICogYGBgXG4gICAqXG4gICAqIEdldCBhbiBhY2Nlc3MgdG9rZW4gaW50ZXJhY3RpdmVseS5cbiAgICpcbiAgICogT3BlbnMgYSBwb3B1cCB3aXRoIHRoZSBgL2F1dGhvcml6ZWAgVVJMIHVzaW5nIHRoZSBwYXJhbWV0ZXJzXG4gICAqIHByb3ZpZGVkIGFzIGFyZ3VtZW50cy4gUmFuZG9tIGFuZCBzZWN1cmUgYHN0YXRlYCBhbmQgYG5vbmNlYFxuICAgKiBwYXJhbWV0ZXJzIHdpbGwgYmUgYXV0by1nZW5lcmF0ZWQuIElmIHRoZSByZXNwb25zZSBpcyBzdWNjZXNzZnVsLFxuICAgKiByZXN1bHRzIHdpbGwgYmUgdmFsaWQgYWNjb3JkaW5nIHRvIHRoZWlyIGV4cGlyYXRpb24gdGltZXMuXG4gICAqL1xuICBnZXRBY2Nlc3NUb2tlbldpdGhQb3B1cChcbiAgICBvcHRpb25zPzogR2V0VG9rZW5XaXRoUG9wdXBPcHRpb25zXG4gICk6IE9ic2VydmFibGU8c3RyaW5nPiB7XG4gICAgcmV0dXJuIG9mKHRoaXMuYXV0aDBDbGllbnQpLnBpcGUoXG4gICAgICBjb25jYXRNYXAoKGNsaWVudCkgPT4gY2xpZW50LmdldFRva2VuV2l0aFBvcHVwKG9wdGlvbnMpKSxcbiAgICAgIHRhcCgoKSA9PiB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpKSxcbiAgICAgIGNhdGNoRXJyb3IoKGVycm9yKSA9PiB7XG4gICAgICAgIHRoaXMuZXJyb3JTdWJqZWN0JC5uZXh0KGVycm9yKTtcbiAgICAgICAgdGhpcy5yZWZyZXNoU3RhdGUkLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoZXJyb3IpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgYXV0aDBIYW5kbGVDYWxsYmFjayh1cmw/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICBpZiAoXG4gICAgICAodXJsPy5pbmNsdWRlcygnY29kZT0nKSB8fCB1cmw/LmluY2x1ZGVzKCdlcnJvcj0nKSkgJiZcbiAgICAgIHVybD8uaW5jbHVkZXMoJ3N0YXRlPScpXG4gICAgKSB7XG4gICAgICBmcm9tKHRoaXMuYXV0aDBDbGllbnQuaGFuZGxlUmVkaXJlY3RDYWxsYmFjayh1cmwpKVxuICAgICAgICAucGlwZShcbiAgICAgICAgICBtYXAoKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHRhcmdldCA9ICcvJztcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgaWYgKHJlc3VsdC5hcHBTdGF0ZSkge1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuYXBwU3RhdGUudGFyZ2V0KSB7XG4gICAgICAgICAgICAgICAgICB0YXJnZXQgPSByZXN1bHQuYXBwU3RhdGUudGFyZ2V0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5uYXZpZ2F0b3IubmF2aWdhdGVCeVVybCh0YXJnZXQpO1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hTdGF0ZSQubmV4dCgpO1xuICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmdTdWJqZWN0JC5uZXh0KGZhbHNlKTtcbiAgICAgICAgICB9KSxcbiAgICAgICAgICB0YWtlVW50aWwodGhpcy5uZ1Vuc3Vic2NyaWJlJClcbiAgICAgICAgKVxuICAgICAgICAuc3Vic2NyaWJlKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzaG91bGRIYW5kbGVDYWxsYmFjaygpOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gb2YodGhpcy5sb2NhdGlvbi5wYXRoKCkpLnBpcGUoXG4gICAgICBtYXAoKHNlYXJjaCkgPT4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIChzZWFyY2guaW5jbHVkZXMoJ2NvZGU9JykgfHwgc2VhcmNoLmluY2x1ZGVzKCdlcnJvcj0nKSkgJiZcbiAgICAgICAgICBzZWFyY2guaW5jbHVkZXMoJ3N0YXRlPScpICYmXG4gICAgICAgICAgIXRoaXMuY29uZmlnRmFjdG9yeS5nZXQoKS5za2lwUmVkaXJlY3RDYWxsYmFja1xuICAgICAgICApO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBoYW5kbGVSZWRpcmVjdENhbGxiYWNrKCk6IE9ic2VydmFibGU8UmVkaXJlY3RMb2dpblJlc3VsdD4ge1xuICAgIHJldHVybiBkZWZlcigoKSA9PiB0aGlzLmF1dGgwQ2xpZW50LmhhbmRsZVJlZGlyZWN0Q2FsbGJhY2soKSkucGlwZShcbiAgICAgIHRhcCgocmVzdWx0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhcmdldCA9IHJlc3VsdD8uYXBwU3RhdGU/LnRhcmdldCA/PyAnLyc7XG4gICAgICAgIHRoaXMubmF2aWdhdG9yLm5hdmlnYXRlQnlVcmwodGFyZ2V0KTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxufVxuIl19
