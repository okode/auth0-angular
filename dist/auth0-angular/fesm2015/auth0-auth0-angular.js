import {
  InjectionToken,
  ɵɵinject,
  ɵɵdefineInjectable,
  ɵsetClassMetadata,
  Injectable,
  Optional,
  Inject,
  Injector,
  ɵɵdefineNgModule,
  ɵɵdefineInjector,
  NgModule,
} from '@angular/core';
import {
  BehaviorSubject,
  ReplaySubject,
  Subject,
  merge,
  defer,
  of,
  iif,
  from,
  throwError,
} from 'rxjs';
import {
  filter,
  distinctUntilChanged,
  switchMap,
  mergeMap,
  concatMap,
  catchError,
  tap,
  takeUntil,
  map,
  take,
  pluck,
  first,
} from 'rxjs/operators';
import { __rest } from 'tslib';
import { Auth0Client } from '@auth0/auth0-spa-js';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

var useragent = { name: '@auth0/auth0-angular', version: '1.3.2' };

class Auth0ClientFactory {
  static createClient(configFactory) {
    const config = configFactory.get();
    if (!config) {
      throw new Error(
        'Configuration must be specified either through AuthModule.forRoot or through AuthClientConfig.set'
      );
    }
    const { redirectUri, clientId, maxAge, httpInterceptor } = config,
      rest = __rest(config, [
        'redirectUri',
        'clientId',
        'maxAge',
        'httpInterceptor',
      ]);
    return new Auth0Client(
      Object.assign(
        Object.assign(
          {
            redirect_uri: redirectUri || window.location.origin,
            client_id: clientId,
            max_age: maxAge,
          },
          rest
        ),
        {
          auth0Client: {
            name: useragent.name,
            version: useragent.version,
          },
        }
      )
    );
  }
}
const Auth0ClientService = new InjectionToken('auth0.client');

/**
 * A custom type guard to help identify route definitions that are actually HttpInterceptorRouteConfig types.
 * @param def The route definition type
 */
function isHttpInterceptorRouteConfig(def) {
  return def.uri !== undefined;
}
/**
 * Gets and sets configuration for the internal Auth0 client. This can be
 * used to provide configuration outside of using AuthModule.forRoot, i.e. from
 * a factory provided by APP_INITIALIZER.
 *
 * @usage
 *
 * ```js
 * // app.module.ts
 * // ---------------------------
 * import { AuthModule, AuthClientConfig } from '@auth0/auth0-angular';
 *
 * // Provide an initializer function that returns a Promise
 * function configInitializer(
 *   http: HttpClient,
 *   config: AuthClientConfig
 * ) {
 *   return () =>
 *     http
 *       .get('/config')
 *       .toPromise()
 *       .then((loadedConfig: any) => config.set(loadedConfig));   // Set the config that was loaded asynchronously here
 * }
 *
 * // Provide APP_INITIALIZER with this function. Note that there is no config passed to AuthModule.forRoot
 * imports: [
 *   // other imports..
 *
 *   HttpClientModule,
 *   AuthModule.forRoot(),   //<- don't pass any config here
 * ],
 * providers: [
 *   {
 *     provide: APP_INITIALIZER,
 *     useFactory: configInitializer,    // <- pass your initializer function here
 *     deps: [HttpClient, AuthClientConfig],
 *     multi: true,
 *   },
 * ],
 * ```
 *
 */
class AuthClientConfig {
  constructor(config) {
    if (config) {
      this.set(config);
    }
  }
  /**
   * Sets configuration to be read by other consumers of the service (see usage notes)
   * @param config The configuration to set
   */
  set(config) {
    this.config = config;
  }
  /**
   * Gets the config that has been set by other consumers of the service
   */
  get() {
    return this.config;
  }
}
AuthClientConfig.ɵfac = function AuthClientConfig_Factory(t) {
  return new (t || AuthClientConfig)(ɵɵinject(AuthConfigService, 8));
};
AuthClientConfig.ɵprov = ɵɵdefineInjectable({
  token: AuthClientConfig,
  factory: AuthClientConfig.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
    AuthClientConfig,
    [
      {
        type: Injectable,
        args: [{ providedIn: 'root' }],
      },
    ],
    function () {
      return [
        {
          type: undefined,
          decorators: [
            {
              type: Optional,
            },
            {
              type: Inject,
              args: [AuthConfigService],
            },
          ],
        },
      ];
    },
    null
  );
})();
/**
 * Injection token for accessing configuration.
 *
 * @usageNotes
 *
 * Use the `Inject` decorator to access the configuration from a service or component:
 *
 * ```
 * class MyService(@Inject(AuthConfigService) config: AuthConfig) {}
 * ```
 */
const AuthConfigService = new InjectionToken('auth0-angular.config');

class AbstractNavigator {
  constructor(location, injector) {
    this.location = location;
    try {
      this.router = injector.get(Router);
    } catch (_a) {}
  }
  /**
   * Navigates to the specified url. The router will be used if one is available, otherwise it falls back
   * to `window.history.replaceState`.
   * @param url The url to navigate to
   */
  navigateByUrl(url) {
    if (this.router) {
      this.router.navigateByUrl(url);
      return;
    }
    this.location.replaceState(url);
  }
}
AbstractNavigator.ɵfac = function AbstractNavigator_Factory(t) {
  return new (t || AbstractNavigator)(ɵɵinject(Location), ɵɵinject(Injector));
};
AbstractNavigator.ɵprov = ɵɵdefineInjectable({
  token: AbstractNavigator,
  factory: AbstractNavigator.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
    AbstractNavigator,
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
      return [{ type: Location }, { type: Injector }];
    },
    null
  );
})();

class AuthService {
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
    ɵɵinject(Auth0ClientService),
    ɵɵinject(AuthClientConfig),
    ɵɵinject(Location),
    ɵɵinject(AbstractNavigator)
  );
};
AuthService.ɵprov = ɵɵdefineInjectable({
  token: AuthService,
  factory: AuthService.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
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
          type: Auth0Client,
          decorators: [
            {
              type: Inject,
              args: [Auth0ClientService],
            },
          ],
        },
        { type: AuthClientConfig },
        { type: Location },
        { type: AbstractNavigator },
      ];
    },
    null
  );
})();

class AuthGuard {
  constructor(auth) {
    this.auth = auth;
  }
  canLoad(route, segments) {
    return this.auth.isAuthenticated$.pipe(take(1));
  }
  canActivate(next, state) {
    return this.redirectIfUnauthenticated(state);
  }
  canActivateChild(childRoute, state) {
    return this.redirectIfUnauthenticated(state);
  }
  redirectIfUnauthenticated(state) {
    return this.auth.isAuthenticated$.pipe(
      tap((loggedIn) => {
        if (!loggedIn) {
          return this.auth.loginWithRedirect({
            appState: { target: state.url },
          });
        } else {
          return of(true);
        }
      })
    );
  }
}
AuthGuard.ɵfac = function AuthGuard_Factory(t) {
  return new (t || AuthGuard)(ɵɵinject(AuthService));
};
AuthGuard.ɵprov = ɵɵdefineInjectable({
  token: AuthGuard,
  factory: AuthGuard.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
    AuthGuard,
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
      return [{ type: AuthService }];
    },
    null
  );
})();

class AuthModule {
  /**
   * Initialize the authentication module system. Configuration can either be specified here,
   * or by calling AuthClientConfig.set (perhaps from an APP_INITIALIZER factory function).
   * @param config The optional configuration for the SDK.
   */
  static forRoot(config) {
    return {
      ngModule: AuthModule,
      providers: [
        AuthService,
        AuthGuard,
        {
          provide: AuthConfigService,
          useValue: config,
        },
        {
          provide: Auth0ClientService,
          useFactory: Auth0ClientFactory.createClient,
          deps: [AuthClientConfig],
        },
      ],
    };
  }
}
AuthModule.ɵmod = ɵɵdefineNgModule({ type: AuthModule });
AuthModule.ɵinj = ɵɵdefineInjector({
  factory: function AuthModule_Factory(t) {
    return new (t || AuthModule)();
  },
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
    AuthModule,
    [
      {
        type: NgModule,
      },
    ],
    null,
    null
  );
})();

class AuthHttpInterceptor {
  constructor(configFactory, authService) {
    this.configFactory = configFactory;
    this.authService = authService;
  }
  intercept(req, next) {
    var _a;
    const config = this.configFactory.get();
    if (
      !((_a = config.httpInterceptor) === null || _a === void 0
        ? void 0
        : _a.allowedList)
    ) {
      return next.handle(req);
    }
    return this.findMatchingRoute(req, config.httpInterceptor).pipe(
      concatMap((route) =>
        iif(
          // Check if a route was matched
          () => route !== null,
          // If we have a matching route, call getTokenSilently and attach the token to the
          // outgoing request
          of(route).pipe(
            pluck('tokenOptions'),
            concatMap((options) =>
              this.authService.getAccessTokenSilently(options)
            ),
            switchMap((token) => {
              // Clone the request and attach the bearer token
              const clone = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${token}`),
              });
              return next.handle(clone);
            })
          ),
          // If the URI being called was not found in our httpInterceptor config, simply
          // pass the request through without attaching a token
          next.handle(req)
        )
      )
    );
  }
  /**
   * Strips the query and fragment from the given uri
   * @param uri The uri to remove the query and fragment from
   */
  stripQueryFrom(uri) {
    if (uri.indexOf('?') > -1) {
      uri = uri.substr(0, uri.indexOf('?'));
    }
    if (uri.indexOf('#') > -1) {
      uri = uri.substr(0, uri.indexOf('#'));
    }
    return uri;
  }
  /**
   * Determines whether the specified route can have an access token attached to it, based on matching the HTTP request against
   * the interceptor route configuration.
   * @param route The route to test
   * @param request The HTTP request
   */
  canAttachToken(route, request) {
    const testPrimitive = (value) => {
      if (value) {
        value.trim();
      }
      if (!value) {
        return false;
      }
      const requestPath = this.stripQueryFrom(request.url);
      if (value === requestPath) {
        return true;
      }
      // If the URL ends with an asterisk, match using startsWith.
      return (
        value.indexOf('*') === value.length - 1 &&
        request.url.startsWith(value.substr(0, value.length - 1))
      );
    };
    if (isHttpInterceptorRouteConfig(route)) {
      if (route.httpMethod && route.httpMethod !== request.method) {
        return false;
      }
      return testPrimitive(route.uri);
    }
    return testPrimitive(route);
  }
  /**
   * Tries to match a route from the SDK configuration to the HTTP request.
   * If a match is found, the route configuration is returned.
   * @param request The Http request
   * @param config HttpInterceptorConfig
   */
  findMatchingRoute(request, config) {
    return from(config.allowedList).pipe(
      first((route) => this.canAttachToken(route, request), null)
    );
  }
}
AuthHttpInterceptor.ɵfac = function AuthHttpInterceptor_Factory(t) {
  return new (t || AuthHttpInterceptor)(
    ɵɵinject(AuthClientConfig),
    ɵɵinject(AuthService)
  );
};
AuthHttpInterceptor.ɵprov = ɵɵdefineInjectable({
  token: AuthHttpInterceptor,
  factory: AuthHttpInterceptor.ɵfac,
});
/*@__PURE__*/ (function () {
  ɵsetClassMetadata(
    AuthHttpInterceptor,
    [
      {
        type: Injectable,
      },
    ],
    function () {
      return [{ type: AuthClientConfig }, { type: AuthService }];
    },
    null
  );
})();

/*
 * Public API Surface of auth0-angular
 */

/**
 * Generated bundle index. Do not edit.
 */

export {
  AuthClientConfig,
  AuthConfigService,
  AuthGuard,
  AuthHttpInterceptor,
  AuthModule,
  AuthService,
  isHttpInterceptorRouteConfig,
};
//# sourceMappingURL=auth0-auth0-angular.js.map
