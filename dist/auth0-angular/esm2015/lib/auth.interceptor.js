import { from, of, iif } from 'rxjs';
import { Injectable } from '@angular/core';
import { isHttpInterceptorRouteConfig } from './auth.config';
import { switchMap, first, concatMap, pluck } from 'rxjs/operators';
import * as i0 from '@angular/core';
import * as i1 from './auth.config';
import * as i2 from './auth.service';
export class AuthHttpInterceptor {
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
    i0.ɵɵinject(i1.AuthClientConfig),
    i0.ɵɵinject(i2.AuthService)
  );
};
AuthHttpInterceptor.ɵprov = i0.ɵɵdefineInjectable({
  token: AuthHttpInterceptor,
  factory: AuthHttpInterceptor.ɵfac,
});
/*@__PURE__*/ (function () {
  i0.ɵsetClassMetadata(
    AuthHttpInterceptor,
    [
      {
        type: Injectable,
      },
    ],
    function () {
      return [{ type: i1.AuthClientConfig }, { type: i2.AuthService }];
    },
    null
  );
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5pbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9wcm9qZWN0cy9hdXRoMC1hbmd1bGFyL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9hdXRoLmludGVyY2VwdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLE9BQU8sRUFBYyxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNqRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sRUFFTCw0QkFBNEIsR0FHN0IsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7O0FBS3BFLE1BQU0sT0FBTyxtQkFBbUI7SUFDOUIsWUFDVSxhQUErQixFQUMvQixXQUF3QjtRQUR4QixrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7UUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQWE7SUFDL0IsQ0FBQztJQUVKLFNBQVMsQ0FDUCxHQUFxQixFQUNyQixJQUFpQjs7UUFFakIsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN4QyxJQUFJLFFBQUMsTUFBTSxDQUFDLGVBQWUsMENBQUUsV0FBVyxDQUFBLEVBQUU7WUFDeEMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQzdELFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQ2xCLEdBQUc7UUFDRCwrQkFBK0I7UUFDL0IsR0FBRyxFQUFFLENBQUMsS0FBSyxLQUFLLElBQUk7UUFDcEIsaUZBQWlGO1FBQ2pGLG1CQUFtQjtRQUNuQixFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUNaLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFDckIsU0FBUyxDQUE4QyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQ2pFLElBQUksQ0FBQyxXQUFXLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLENBQ2pELEVBQ0QsU0FBUyxDQUFDLENBQUMsS0FBYSxFQUFFLEVBQUU7WUFDMUIsZ0RBQWdEO1lBQ2hELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0JBQ3RCLE9BQU8sRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsVUFBVSxLQUFLLEVBQUUsQ0FBQzthQUM3RCxDQUFDLENBQUM7WUFFSCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDLENBQ0g7UUFDRCw4RUFBOEU7UUFDOUUscURBQXFEO1FBQ3JELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQ2pCLENBQ0YsQ0FDRixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7T0FHRztJQUNLLGNBQWMsQ0FBQyxHQUFXO1FBQ2hDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUN6QixHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3ZDO1FBRUQsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ3pCLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDdkM7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLGNBQWMsQ0FDcEIsS0FBeUIsRUFDekIsT0FBeUI7UUFFekIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxLQUFhLEVBQVcsRUFBRTtZQUMvQyxJQUFJLEtBQUssRUFBRTtnQkFDVCxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDZDtZQUVELElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ1YsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUVELE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRXJELElBQUksS0FBSyxLQUFLLFdBQVcsRUFBRTtnQkFDekIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELDREQUE0RDtZQUM1RCxPQUFPLENBQ0wsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FDMUQsQ0FBQztRQUNKLENBQUMsQ0FBQztRQUVGLElBQUksNEJBQTRCLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDdkMsSUFBSSxLQUFLLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLE1BQU0sRUFBRTtnQkFDM0QsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNqQztRQUVELE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNLLGlCQUFpQixDQUN2QixPQUF5QixFQUN6QixNQUE2QjtRQUU3QixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUNsQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUM1RCxDQUFDO0lBQ0osQ0FBQzs7c0ZBcEhVLG1CQUFtQjsyREFBbkIsbUJBQW1CLFdBQW5CLG1CQUFtQjtrREFBbkIsbUJBQW1CO2NBRC9CLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBIdHRwSW50ZXJjZXB0b3IsXG4gIEh0dHBSZXF1ZXN0LFxuICBIdHRwSGFuZGxlcixcbiAgSHR0cEV2ZW50LFxufSBmcm9tICdAYW5ndWxhci9jb21tb24vaHR0cCc7XG5cbmltcG9ydCB7IE9ic2VydmFibGUsIGZyb20sIG9mLCBpaWYgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtcbiAgQXBpUm91dGVEZWZpbml0aW9uLFxuICBpc0h0dHBJbnRlcmNlcHRvclJvdXRlQ29uZmlnLFxuICBBdXRoQ2xpZW50Q29uZmlnLFxuICBIdHRwSW50ZXJjZXB0b3JDb25maWcsXG59IGZyb20gJy4vYXV0aC5jb25maWcnO1xuXG5pbXBvcnQgeyBzd2l0Y2hNYXAsIGZpcnN0LCBjb25jYXRNYXAsIHBsdWNrIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuL2F1dGguc2VydmljZSc7XG5pbXBvcnQgeyBHZXRUb2tlblNpbGVudGx5T3B0aW9ucyB9IGZyb20gJ0BhdXRoMC9hdXRoMC1zcGEtanMnO1xuXG5ASW5qZWN0YWJsZSgpXG5leHBvcnQgY2xhc3MgQXV0aEh0dHBJbnRlcmNlcHRvciBpbXBsZW1lbnRzIEh0dHBJbnRlcmNlcHRvciB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgY29uZmlnRmFjdG9yeTogQXV0aENsaWVudENvbmZpZyxcbiAgICBwcml2YXRlIGF1dGhTZXJ2aWNlOiBBdXRoU2VydmljZVxuICApIHt9XG5cbiAgaW50ZXJjZXB0KFxuICAgIHJlcTogSHR0cFJlcXVlc3Q8YW55PixcbiAgICBuZXh0OiBIdHRwSGFuZGxlclxuICApOiBPYnNlcnZhYmxlPEh0dHBFdmVudDxhbnk+PiB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWdGYWN0b3J5LmdldCgpO1xuICAgIGlmICghY29uZmlnLmh0dHBJbnRlcmNlcHRvcj8uYWxsb3dlZExpc3QpIHtcbiAgICAgIHJldHVybiBuZXh0LmhhbmRsZShyZXEpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmZpbmRNYXRjaGluZ1JvdXRlKHJlcSwgY29uZmlnLmh0dHBJbnRlcmNlcHRvcikucGlwZShcbiAgICAgIGNvbmNhdE1hcCgocm91dGUpID0+XG4gICAgICAgIGlpZihcbiAgICAgICAgICAvLyBDaGVjayBpZiBhIHJvdXRlIHdhcyBtYXRjaGVkXG4gICAgICAgICAgKCkgPT4gcm91dGUgIT09IG51bGwsXG4gICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhIG1hdGNoaW5nIHJvdXRlLCBjYWxsIGdldFRva2VuU2lsZW50bHkgYW5kIGF0dGFjaCB0aGUgdG9rZW4gdG8gdGhlXG4gICAgICAgICAgLy8gb3V0Z29pbmcgcmVxdWVzdFxuICAgICAgICAgIG9mKHJvdXRlKS5waXBlKFxuICAgICAgICAgICAgcGx1Y2soJ3Rva2VuT3B0aW9ucycpLFxuICAgICAgICAgICAgY29uY2F0TWFwPEdldFRva2VuU2lsZW50bHlPcHRpb25zLCBPYnNlcnZhYmxlPHN0cmluZz4+KChvcHRpb25zKSA9PlxuICAgICAgICAgICAgICB0aGlzLmF1dGhTZXJ2aWNlLmdldEFjY2Vzc1Rva2VuU2lsZW50bHkob3B0aW9ucylcbiAgICAgICAgICAgICksXG4gICAgICAgICAgICBzd2l0Y2hNYXAoKHRva2VuOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgLy8gQ2xvbmUgdGhlIHJlcXVlc3QgYW5kIGF0dGFjaCB0aGUgYmVhcmVyIHRva2VuXG4gICAgICAgICAgICAgIGNvbnN0IGNsb25lID0gcmVxLmNsb25lKHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXEuaGVhZGVycy5zZXQoJ0F1dGhvcml6YXRpb24nLCBgQmVhcmVyICR7dG9rZW59YCksXG4gICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiBuZXh0LmhhbmRsZShjbG9uZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICAgICAgLy8gSWYgdGhlIFVSSSBiZWluZyBjYWxsZWQgd2FzIG5vdCBmb3VuZCBpbiBvdXIgaHR0cEludGVyY2VwdG9yIGNvbmZpZywgc2ltcGx5XG4gICAgICAgICAgLy8gcGFzcyB0aGUgcmVxdWVzdCB0aHJvdWdoIHdpdGhvdXQgYXR0YWNoaW5nIGEgdG9rZW5cbiAgICAgICAgICBuZXh0LmhhbmRsZShyZXEpXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0cmlwcyB0aGUgcXVlcnkgYW5kIGZyYWdtZW50IGZyb20gdGhlIGdpdmVuIHVyaVxuICAgKiBAcGFyYW0gdXJpIFRoZSB1cmkgdG8gcmVtb3ZlIHRoZSBxdWVyeSBhbmQgZnJhZ21lbnQgZnJvbVxuICAgKi9cbiAgcHJpdmF0ZSBzdHJpcFF1ZXJ5RnJvbSh1cmk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgaWYgKHVyaS5pbmRleE9mKCc/JykgPiAtMSkge1xuICAgICAgdXJpID0gdXJpLnN1YnN0cigwLCB1cmkuaW5kZXhPZignPycpKTtcbiAgICB9XG5cbiAgICBpZiAodXJpLmluZGV4T2YoJyMnKSA+IC0xKSB7XG4gICAgICB1cmkgPSB1cmkuc3Vic3RyKDAsIHVyaS5pbmRleE9mKCcjJykpO1xuICAgIH1cblxuICAgIHJldHVybiB1cmk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBzcGVjaWZpZWQgcm91dGUgY2FuIGhhdmUgYW4gYWNjZXNzIHRva2VuIGF0dGFjaGVkIHRvIGl0LCBiYXNlZCBvbiBtYXRjaGluZyB0aGUgSFRUUCByZXF1ZXN0IGFnYWluc3RcbiAgICogdGhlIGludGVyY2VwdG9yIHJvdXRlIGNvbmZpZ3VyYXRpb24uXG4gICAqIEBwYXJhbSByb3V0ZSBUaGUgcm91dGUgdG8gdGVzdFxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSFRUUCByZXF1ZXN0XG4gICAqL1xuICBwcml2YXRlIGNhbkF0dGFjaFRva2VuKFxuICAgIHJvdXRlOiBBcGlSb3V0ZURlZmluaXRpb24sXG4gICAgcmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PlxuICApOiBib29sZWFuIHtcbiAgICBjb25zdCB0ZXN0UHJpbWl0aXZlID0gKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuID0+IHtcbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICB2YWx1ZS50cmltKCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZXF1ZXN0UGF0aCA9IHRoaXMuc3RyaXBRdWVyeUZyb20ocmVxdWVzdC51cmwpO1xuXG4gICAgICBpZiAodmFsdWUgPT09IHJlcXVlc3RQYXRoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgVVJMIGVuZHMgd2l0aCBhbiBhc3RlcmlzaywgbWF0Y2ggdXNpbmcgc3RhcnRzV2l0aC5cbiAgICAgIHJldHVybiAoXG4gICAgICAgIHZhbHVlLmluZGV4T2YoJyonKSA9PT0gdmFsdWUubGVuZ3RoIC0gMSAmJlxuICAgICAgICByZXF1ZXN0LnVybC5zdGFydHNXaXRoKHZhbHVlLnN1YnN0cigwLCB2YWx1ZS5sZW5ndGggLSAxKSlcbiAgICAgICk7XG4gICAgfTtcblxuICAgIGlmIChpc0h0dHBJbnRlcmNlcHRvclJvdXRlQ29uZmlnKHJvdXRlKSkge1xuICAgICAgaWYgKHJvdXRlLmh0dHBNZXRob2QgJiYgcm91dGUuaHR0cE1ldGhvZCAhPT0gcmVxdWVzdC5tZXRob2QpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGVzdFByaW1pdGl2ZShyb3V0ZS51cmkpO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXN0UHJpbWl0aXZlKHJvdXRlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmllcyB0byBtYXRjaCBhIHJvdXRlIGZyb20gdGhlIFNESyBjb25maWd1cmF0aW9uIHRvIHRoZSBIVFRQIHJlcXVlc3QuXG4gICAqIElmIGEgbWF0Y2ggaXMgZm91bmQsIHRoZSByb3V0ZSBjb25maWd1cmF0aW9uIGlzIHJldHVybmVkLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSHR0cCByZXF1ZXN0XG4gICAqIEBwYXJhbSBjb25maWcgSHR0cEludGVyY2VwdG9yQ29uZmlnXG4gICAqL1xuICBwcml2YXRlIGZpbmRNYXRjaGluZ1JvdXRlKFxuICAgIHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sXG4gICAgY29uZmlnOiBIdHRwSW50ZXJjZXB0b3JDb25maWdcbiAgKTogT2JzZXJ2YWJsZTxBcGlSb3V0ZURlZmluaXRpb24gfCBudWxsPiB7XG4gICAgcmV0dXJuIGZyb20oY29uZmlnLmFsbG93ZWRMaXN0KS5waXBlKFxuICAgICAgZmlyc3QoKHJvdXRlKSA9PiB0aGlzLmNhbkF0dGFjaFRva2VuKHJvdXRlLCByZXF1ZXN0KSwgbnVsbClcbiAgICApO1xuICB9XG59XG4iXX0=
