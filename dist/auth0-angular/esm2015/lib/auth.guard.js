import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import * as i0 from '@angular/core';
import * as i1 from './auth.service';
export class AuthGuard {
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
  return new (t || AuthGuard)(i0.ɵɵinject(i1.AuthService));
};
AuthGuard.ɵprov = i0.ɵɵdefineInjectable({
  token: AuthGuard,
  factory: AuthGuard.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  i0.ɵsetClassMetadata(
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
      return [{ type: i1.AuthService }];
    },
    null
  );
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5ndWFyZC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9wcm9qZWN0cy9hdXRoMC1hbmd1bGFyL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9hdXRoLmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFVM0MsT0FBTyxFQUFjLEVBQUUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUN0QyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDOzs7QUFNM0MsTUFBTSxPQUFPLFNBQVM7SUFDcEIsWUFBb0IsSUFBaUI7UUFBakIsU0FBSSxHQUFKLElBQUksQ0FBYTtJQUFHLENBQUM7SUFFekMsT0FBTyxDQUFDLEtBQVksRUFBRSxRQUFzQjtRQUMxQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxXQUFXLENBQ1QsSUFBNEIsRUFDNUIsS0FBMEI7UUFFMUIsT0FBTyxJQUFJLENBQUMseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELGdCQUFnQixDQUNkLFVBQWtDLEVBQ2xDLEtBQTBCO1FBRTFCLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFTyx5QkFBeUIsQ0FDL0IsS0FBMEI7UUFFMUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FDcEMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDZixJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztvQkFDakMsUUFBUSxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7aUJBQ2hDLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2pCO1FBQ0gsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUM7O2tFQW5DVSxTQUFTO2lEQUFULFNBQVMsV0FBVCxTQUFTLG1CQUZSLE1BQU07a0RBRVAsU0FBUztjQUhyQixVQUFVO2VBQUM7Z0JBQ1YsVUFBVSxFQUFFLE1BQU07YUFDbkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LFxuICBSb3V0ZXJTdGF0ZVNuYXBzaG90LFxuICBDYW5BY3RpdmF0ZSxcbiAgQ2FuTG9hZCxcbiAgUm91dGUsXG4gIFVybFNlZ21lbnQsXG4gIENhbkFjdGl2YXRlQ2hpbGQsXG59IGZyb20gJ0Bhbmd1bGFyL3JvdXRlcic7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBvZiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHsgdGFwLCB0YWtlIH0gZnJvbSAncnhqcy9vcGVyYXRvcnMnO1xuaW1wb3J0IHsgQXV0aFNlcnZpY2UgfSBmcm9tICcuL2F1dGguc2VydmljZSc7XG5cbkBJbmplY3RhYmxlKHtcbiAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxufSlcbmV4cG9ydCBjbGFzcyBBdXRoR3VhcmQgaW1wbGVtZW50cyBDYW5BY3RpdmF0ZSwgQ2FuTG9hZCwgQ2FuQWN0aXZhdGVDaGlsZCB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYXV0aDogQXV0aFNlcnZpY2UpIHt9XG5cbiAgY2FuTG9hZChyb3V0ZTogUm91dGUsIHNlZ21lbnRzOiBVcmxTZWdtZW50W10pOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmlzQXV0aGVudGljYXRlZCQucGlwZSh0YWtlKDEpKTtcbiAgfVxuXG4gIGNhbkFjdGl2YXRlKFxuICAgIG5leHQ6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3RcbiAgKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMucmVkaXJlY3RJZlVuYXV0aGVudGljYXRlZChzdGF0ZSk7XG4gIH1cblxuICBjYW5BY3RpdmF0ZUNoaWxkKFxuICAgIGNoaWxkUm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3RcbiAgKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMucmVkaXJlY3RJZlVuYXV0aGVudGljYXRlZChzdGF0ZSk7XG4gIH1cblxuICBwcml2YXRlIHJlZGlyZWN0SWZVbmF1dGhlbnRpY2F0ZWQoXG4gICAgc3RhdGU6IFJvdXRlclN0YXRlU25hcHNob3RcbiAgKTogT2JzZXJ2YWJsZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuYXV0aC5pc0F1dGhlbnRpY2F0ZWQkLnBpcGUoXG4gICAgICB0YXAoKGxvZ2dlZEluKSA9PiB7XG4gICAgICAgIGlmICghbG9nZ2VkSW4pIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hdXRoLmxvZ2luV2l0aFJlZGlyZWN0KHtcbiAgICAgICAgICAgIGFwcFN0YXRlOiB7IHRhcmdldDogc3RhdGUudXJsIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG9mKHRydWUpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICk7XG4gIH1cbn1cbiJdfQ==
