import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { tap, take } from 'rxjs/operators';
import { AuthService } from './auth.service';
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
AuthGuard.ɵprov = i0.ɵɵdefineInjectable({
  factory: function AuthGuard_Factory() {
    return new AuthGuard(i0.ɵɵinject(i1.AuthService));
  },
  token: AuthGuard,
  providedIn: 'root',
});
AuthGuard.decorators = [
  {
    type: Injectable,
    args: [
      {
        providedIn: 'root',
      },
    ],
  },
];
AuthGuard.ctorParameters = () => [{ type: AuthService }];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5ndWFyZC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8uLi9wcm9qZWN0cy9hdXRoMC1hbmd1bGFyL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9hdXRoLmd1YXJkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFVM0MsT0FBTyxFQUFjLEVBQUUsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUN0QyxPQUFPLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzNDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7O0FBSzdDLE1BQU0sT0FBTyxTQUFTO0lBQ3BCLFlBQW9CLElBQWlCO1FBQWpCLFNBQUksR0FBSixJQUFJLENBQWE7SUFBRyxDQUFDO0lBRXpDLE9BQU8sQ0FBQyxLQUFZLEVBQUUsUUFBc0I7UUFDMUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRUQsV0FBVyxDQUNULElBQTRCLEVBQzVCLEtBQTBCO1FBRTFCLE9BQU8sSUFBSSxDQUFDLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxnQkFBZ0IsQ0FDZCxVQUFrQyxFQUNsQyxLQUEwQjtRQUUxQixPQUFPLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBRU8seUJBQXlCLENBQy9CLEtBQTBCO1FBRTFCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQ3BDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ2YsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7b0JBQ2pDLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO2lCQUNoQyxDQUFDLENBQUM7YUFDSjtpQkFBTTtnQkFDTCxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQjtRQUNILENBQUMsQ0FBQyxDQUNILENBQUM7SUFDSixDQUFDOzs7O1lBdENGLFVBQVUsU0FBQztnQkFDVixVQUFVLEVBQUUsTUFBTTthQUNuQjs7O1lBSlEsV0FBVyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIEFjdGl2YXRlZFJvdXRlU25hcHNob3QsXG4gIFJvdXRlclN0YXRlU25hcHNob3QsXG4gIENhbkFjdGl2YXRlLFxuICBDYW5Mb2FkLFxuICBSb3V0ZSxcbiAgVXJsU2VnbWVudCxcbiAgQ2FuQWN0aXZhdGVDaGlsZCxcbn0gZnJvbSAnQGFuZ3VsYXIvcm91dGVyJztcbmltcG9ydCB7IE9ic2VydmFibGUsIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyB0YXAsIHRha2UgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBBdXRoU2VydmljZSB9IGZyb20gJy4vYXV0aC5zZXJ2aWNlJztcblxuQEluamVjdGFibGUoe1xuICBwcm92aWRlZEluOiAncm9vdCcsXG59KVxuZXhwb3J0IGNsYXNzIEF1dGhHdWFyZCBpbXBsZW1lbnRzIENhbkFjdGl2YXRlLCBDYW5Mb2FkLCBDYW5BY3RpdmF0ZUNoaWxkIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhdXRoOiBBdXRoU2VydmljZSkge31cblxuICBjYW5Mb2FkKHJvdXRlOiBSb3V0ZSwgc2VnbWVudHM6IFVybFNlZ21lbnRbXSk6IE9ic2VydmFibGU8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmF1dGguaXNBdXRoZW50aWNhdGVkJC5waXBlKHRha2UoMSkpO1xuICB9XG5cbiAgY2FuQWN0aXZhdGUoXG4gICAgbmV4dDogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgICBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdFxuICApOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5yZWRpcmVjdElmVW5hdXRoZW50aWNhdGVkKHN0YXRlKTtcbiAgfVxuXG4gIGNhbkFjdGl2YXRlQ2hpbGQoXG4gICAgY2hpbGRSb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCxcbiAgICBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdFxuICApOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5yZWRpcmVjdElmVW5hdXRoZW50aWNhdGVkKHN0YXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVkaXJlY3RJZlVuYXV0aGVudGljYXRlZChcbiAgICBzdGF0ZTogUm91dGVyU3RhdGVTbmFwc2hvdFxuICApOiBPYnNlcnZhYmxlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5hdXRoLmlzQXV0aGVudGljYXRlZCQucGlwZShcbiAgICAgIHRhcCgobG9nZ2VkSW4pID0+IHtcbiAgICAgICAgaWYgKCFsb2dnZWRJbikge1xuICAgICAgICAgIHJldHVybiB0aGlzLmF1dGgubG9naW5XaXRoUmVkaXJlY3Qoe1xuICAgICAgICAgICAgYXBwU3RhdGU6IHsgdGFyZ2V0OiBzdGF0ZS51cmwgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gb2YodHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgfVxufVxuIl19
