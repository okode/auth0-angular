import { from, of, iif } from 'rxjs';
import { Injectable } from '@angular/core';
import { isHttpInterceptorRouteConfig, AuthClientConfig } from './auth.config';
import { switchMap, first, concatMap, pluck } from 'rxjs/operators';
import { AuthService } from './auth.service';
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
AuthHttpInterceptor.decorators = [{ type: Injectable }];
AuthHttpInterceptor.ctorParameters = () => [
  { type: AuthClientConfig },
  { type: AuthService },
];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5pbnRlcmNlcHRvci5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9wcm9qZWN0cy9hdXRoMC1hbmd1bGFyL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9hdXRoLmludGVyY2VwdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQU9BLE9BQU8sRUFBYyxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUNqRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTNDLE9BQU8sRUFFTCw0QkFBNEIsRUFDNUIsZ0JBQWdCLEdBRWpCLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFJN0MsTUFBTSxPQUFPLG1CQUFtQjtJQUM5QixZQUNVLGFBQStCLEVBQy9CLFdBQXdCO1FBRHhCLGtCQUFhLEdBQWIsYUFBYSxDQUFrQjtRQUMvQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtJQUMvQixDQUFDO0lBRUosU0FBUyxDQUNQLEdBQXFCLEVBQ3JCLElBQWlCOztRQUVqQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3hDLElBQUksUUFBQyxNQUFNLENBQUMsZUFBZSwwQ0FBRSxXQUFXLENBQUEsRUFBRTtZQUN4QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7UUFFRCxPQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FDN0QsU0FBUyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FDbEIsR0FBRztRQUNELCtCQUErQjtRQUMvQixHQUFHLEVBQUUsQ0FBQyxLQUFLLEtB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QUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQzVELENBQUM7SUFDSixDQUFDOzs7WUFySEYsVUFBVTs7O1lBUlQsZ0JBQWdCO1lBS1QsV0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEh0dHBJbnRlcmNlcHRvcixcbiAgSHR0cFJlcXVlc3QsXG4gIEh0dHBIYW5kbGVyLFxuICBIdHRwRXZlbnQsXG59IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbi9odHRwJztcblxuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgZnJvbSwgb2YsIGlpZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG5pbXBvcnQge1xuICBBcGlSb3V0ZURlZmluaXRpb24sXG4gIGlzSHR0cEludGVyY2VwdG9yUm91dGVDb25maWcsXG4gIEF1dGhDbGllbnRDb25maWcsXG4gIEh0dHBJbnRlcmNlcHRvckNvbmZpZyxcbn0gZnJvbSAnLi9hdXRoLmNvbmZpZyc7XG5cbmltcG9ydCB7IHN3aXRjaE1hcCwgZmlyc3QsIGNvbmNhdE1hcCwgcGx1Y2sgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4vYXV0aC5zZXJ2aWNlJztcbmltcG9ydCB7IEdldFRva2VuU2lsZW50bHlPcHRpb25zIH0gZnJvbSAnQGF1dGgwL2F1dGgwLXNwYS1qcyc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBBdXRoSHR0cEludGVyY2VwdG9yIGltcGxlbWVudHMgSHR0cEludGVyY2VwdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBjb25maWdGYWN0b3J5OiBBdXRoQ2xpZW50Q29uZmlnLFxuICAgIHByaXZhdGUgYXV0aFNlcnZpY2U6IEF1dGhTZXJ2aWNlXG4gICkge31cblxuICBpbnRlcmNlcHQoXG4gICAgcmVxOiBIdHRwUmVxdWVzdDxhbnk+LFxuICAgIG5leHQ6IEh0dHBIYW5kbGVyXG4gICk6IE9ic2VydmFibGU8SHR0cEV2ZW50PGFueT4+IHtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLmNvbmZpZ0ZhY3RvcnkuZ2V0KCk7XG4gICAgaWYgKCFjb25maWcuaHR0cEludGVyY2VwdG9yPy5hbGxvd2VkTGlzdCkge1xuICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKHJlcSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZmluZE1hdGNoaW5nUm91dGUocmVxLCBjb25maWcuaHR0cEludGVyY2VwdG9yKS5waXBlKFxuICAgICAgY29uY2F0TWFwKChyb3V0ZSkgPT5cbiAgICAgICAgaWlmKFxuICAgICAgICAgIC8vIENoZWNrIGlmIGEgcm91dGUgd2FzIG1hdGNoZWRcbiAgICAgICAgICAoKSA9PiByb3V0ZSAhPT0gbnVsbCxcbiAgICAgICAgICAvLyBJZiB3ZSBoYXZlIGEgbWF0Y2hpbmcgcm91dGUsIGNhbGwgZ2V0VG9rZW5TaWxlbnRseSBhbmQgYXR0YWNoIHRoZSB0b2tlbiB0byB0aGVcbiAgICAgICAgICAvLyBvdXRnb2luZyByZXF1ZXN0XG4gICAgICAgICAgb2Yocm91dGUpLnBpcGUoXG4gICAgICAgICAgICBwbHVjaygndG9rZW5PcHRpb25zJyksXG4gICAgICAgICAgICBjb25jYXRNYXA8R2V0VG9rZW5TaWxlbnRseU9wdGlvbnMsIE9ic2VydmFibGU8c3RyaW5nPj4oKG9wdGlvbnMpID0+XG4gICAgICAgICAgICAgIHRoaXMuYXV0aFNlcnZpY2UuZ2V0QWNjZXNzVG9rZW5TaWxlbnRseShvcHRpb25zKVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIHN3aXRjaE1hcCgodG9rZW46IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAvLyBDbG9uZSB0aGUgcmVxdWVzdCBhbmQgYXR0YWNoIHRoZSBiZWFyZXIgdG9rZW5cbiAgICAgICAgICAgICAgY29uc3QgY2xvbmUgPSByZXEuY2xvbmUoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHJlcS5oZWFkZXJzLnNldCgnQXV0aG9yaXphdGlvbicsIGBCZWFyZXIgJHt0b2tlbn1gKSxcbiAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgcmV0dXJuIG5leHQuaGFuZGxlKGNsb25lKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKSxcbiAgICAgICAgICAvLyBJZiB0aGUgVVJJIGJlaW5nIGNhbGxlZCB3YXMgbm90IGZvdW5kIGluIG91ciBodHRwSW50ZXJjZXB0b3IgY29uZmlnLCBzaW1wbHlcbiAgICAgICAgICAvLyBwYXNzIHRoZSByZXF1ZXN0IHRocm91Z2ggd2l0aG91dCBhdHRhY2hpbmcgYSB0b2tlblxuICAgICAgICAgIG5leHQuaGFuZGxlKHJlcSlcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogU3RyaXBzIHRoZSBxdWVyeSBhbmQgZnJhZ21lbnQgZnJvbSB0aGUgZ2l2ZW4gdXJpXG4gICAqIEBwYXJhbSB1cmkgVGhlIHVyaSB0byByZW1vdmUgdGhlIHF1ZXJ5IGFuZCBmcmFnbWVudCBmcm9tXG4gICAqL1xuICBwcml2YXRlIHN0cmlwUXVlcnlGcm9tKHVyaTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBpZiAodXJpLmluZGV4T2YoJz8nKSA+IC0xKSB7XG4gICAgICB1cmkgPSB1cmkuc3Vic3RyKDAsIHVyaS5pbmRleE9mKCc/JykpO1xuICAgIH1cblxuICAgIGlmICh1cmkuaW5kZXhPZignIycpID4gLTEpIHtcbiAgICAgIHVyaSA9IHVyaS5zdWJzdHIoMCwgdXJpLmluZGV4T2YoJyMnKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVyaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIHNwZWNpZmllZCByb3V0ZSBjYW4gaGF2ZSBhbiBhY2Nlc3MgdG9rZW4gYXR0YWNoZWQgdG8gaXQsIGJhc2VkIG9uIG1hdGNoaW5nIHRoZSBIVFRQIHJlcXVlc3QgYWdhaW5zdFxuICAgKiB0aGUgaW50ZXJjZXB0b3Igcm91dGUgY29uZmlndXJhdGlvbi5cbiAgICogQHBhcmFtIHJvdXRlIFRoZSByb3V0ZSB0byB0ZXN0XG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBIVFRQIHJlcXVlc3RcbiAgICovXG4gIHByaXZhdGUgY2FuQXR0YWNoVG9rZW4oXG4gICAgcm91dGU6IEFwaVJvdXRlRGVmaW5pdGlvbixcbiAgICByZXF1ZXN0OiBIdHRwUmVxdWVzdDxhbnk+XG4gICk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHRlc3RQcmltaXRpdmUgPSAodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHZhbHVlLnRyaW0oKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcXVlc3RQYXRoID0gdGhpcy5zdHJpcFF1ZXJ5RnJvbShyZXF1ZXN0LnVybCk7XG5cbiAgICAgIGlmICh2YWx1ZSA9PT0gcmVxdWVzdFBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZSBVUkwgZW5kcyB3aXRoIGFuIGFzdGVyaXNrLCBtYXRjaCB1c2luZyBzdGFydHNXaXRoLlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgdmFsdWUuaW5kZXhPZignKicpID09PSB2YWx1ZS5sZW5ndGggLSAxICYmXG4gICAgICAgIHJlcXVlc3QudXJsLnN0YXJ0c1dpdGgodmFsdWUuc3Vic3RyKDAsIHZhbHVlLmxlbmd0aCAtIDEpKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgaWYgKGlzSHR0cEludGVyY2VwdG9yUm91dGVDb25maWcocm91dGUpKSB7XG4gICAgICBpZiAocm91dGUuaHR0cE1ldGhvZCAmJiByb3V0ZS5odHRwTWV0aG9kICE9PSByZXF1ZXN0Lm1ldGhvZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0ZXN0UHJpbWl0aXZlKHJvdXRlLnVyaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRlc3RQcmltaXRpdmUocm91dGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWVzIHRvIG1hdGNoIGEgcm91dGUgZnJvbSB0aGUgU0RLIGNvbmZpZ3VyYXRpb24gdG8gdGhlIEhUVFAgcmVxdWVzdC5cbiAgICogSWYgYSBtYXRjaCBpcyBmb3VuZCwgdGhlIHJvdXRlIGNvbmZpZ3VyYXRpb24gaXMgcmV0dXJuZWQuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBIdHRwIHJlcXVlc3RcbiAgICogQHBhcmFtIGNvbmZpZyBIdHRwSW50ZXJjZXB0b3JDb25maWdcbiAgICovXG4gIHByaXZhdGUgZmluZE1hdGNoaW5nUm91dGUoXG4gICAgcmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PixcbiAgICBjb25maWc6IEh0dHBJbnRlcmNlcHRvckNvbmZpZ1xuICApOiBPYnNlcnZhYmxlPEFwaVJvdXRlRGVmaW5pdGlvbiB8IG51bGw+IHtcbiAgICByZXR1cm4gZnJvbShjb25maWcuYWxsb3dlZExpc3QpLnBpcGUoXG4gICAgICBmaXJzdCgocm91dGUpID0+IHRoaXMuY2FuQXR0YWNoVG9rZW4ocm91dGUsIHJlcXVlc3QpLCBudWxsKVxuICAgICk7XG4gIH1cbn1cbiJdfQ==
