import { OnDestroy } from '@angular/core';
import {
  Auth0Client,
  RedirectLoginOptions,
  PopupLoginOptions,
  PopupConfigOptions,
  LogoutOptions,
  GetTokenSilentlyOptions,
  GetTokenWithPopupOptions,
} from '@auth0/auth0-spa-js';
import { Observable } from 'rxjs';
import { AbstractNavigator } from './abstract-navigator';
import { Location } from '@angular/common';
import { AuthClientConfig } from './auth.config';
import * as ɵngcc0 from '@angular/core';
export declare class AuthService implements OnDestroy {
  private auth0Client;
  private configFactory;
  private location;
  private navigator;
  private isLoadingSubject$;
  private errorSubject$;
  private refreshState$;
  private ngUnsubscribe$;
  /**
   * Emits boolean values indicating the loading state of the SDK.
   */
  readonly isLoading$: Observable<boolean>;
  /**
   * Trigger used to pull User information from the Auth0Client.
   * Triggers when an event occurs that needs to retrigger the User Profile information.
   * Such as: Initially, getAccessTokenSilently, getAccessTokenWithPopup and Logout
   */
  private isAuthenticatedTrigger$;
  /**
   * Emits boolean values indicating the authentication state of the user. If `true`, it means a user has authenticated.
   * This depends on the value of `isLoading$`, so there is no need to manually check the loading state of the SDK.
   */
  readonly isAuthenticated$: Observable<boolean>;
  /**
   * Emits details about the authenticated user, or null if not authenticated.
   */
  readonly user$: Observable<
    import('@auth0/auth0-spa-js').User | null | undefined
  >;
  /**
   * Emits ID token claims when authenticated, or null if not authenticated.
   */
  readonly idTokenClaims$: Observable<
    import('@auth0/auth0-spa-js').IdToken | null
  >;
  /**
   * Emits errors that occur during login, or when checking for an active session on startup.
   */
  readonly error$: Observable<Error>;
  constructor(
    auth0Client: Auth0Client,
    configFactory: AuthClientConfig,
    location: Location,
    navigator: AbstractNavigator
  );
  /**
   * Called when the service is destroyed
   */
  ngOnDestroy(): void;
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
  loginWithRedirect(options?: RedirectLoginOptions): Observable<void>;
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
  loginWithPopup(
    options?: PopupLoginOptions,
    config?: PopupConfigOptions
  ): Observable<void>;
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
  logout(options?: LogoutOptions): void;
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
  getAccessTokenSilently(options?: GetTokenSilentlyOptions): Observable<string>;
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
  getAccessTokenWithPopup(
    options?: GetTokenWithPopupOptions
  ): Observable<string>;
  auth0HandleCallback(url?: string): void;
  private shouldHandleCallback;
  private handleRedirectCallback;
  static ɵfac: ɵngcc0.ɵɵFactoryDef<AuthService, never>;
}

//# sourceMappingURL=auth.service.d.ts.map
