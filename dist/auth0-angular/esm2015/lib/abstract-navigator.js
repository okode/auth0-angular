import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as i0 from '@angular/core';
import * as i1 from '@angular/common';
export class AbstractNavigator {
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
  return new (t || AbstractNavigator)(
    i0.ɵɵinject(i1.Location),
    i0.ɵɵinject(i0.Injector)
  );
};
AbstractNavigator.ɵprov = i0.ɵɵdefineInjectable({
  token: AbstractNavigator,
  factory: AbstractNavigator.ɵfac,
  providedIn: 'root',
});
/*@__PURE__*/ (function () {
  i0.ɵsetClassMetadata(
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
      return [{ type: i1.Location }, { type: i0.Injector }];
    },
    null
  );
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWJzdHJhY3QtbmF2aWdhdG9yLmpzIiwic291cmNlUm9vdCI6Ii4uLy4uLy4uL3Byb2plY3RzL2F1dGgwLWFuZ3VsYXIvc3JjLyIsInNvdXJjZXMiOlsibGliL2Fic3RyYWN0LW5hdmlnYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFZLE1BQU0sZUFBZSxDQUFDO0FBQ3JELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQzs7O0FBTXpDLE1BQU0sT0FBTyxpQkFBaUI7SUFHNUIsWUFBb0IsUUFBa0IsRUFBRSxRQUFrQjtRQUF0QyxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBQ3BDLElBQUk7WUFDRixJQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDcEM7UUFBQyxXQUFNLEdBQUU7SUFDWixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGFBQWEsQ0FBQyxHQUFXO1FBQ3ZCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRS9CLE9BQU87U0FDUjtRQUVELElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7O2tGQXRCVSxpQkFBaUI7eURBQWpCLGlCQUFpQixXQUFqQixpQkFBaUIsbUJBRmhCLE1BQU07a0RBRVAsaUJBQWlCO2NBSDdCLFVBQVU7ZUFBQztnQkFDVixVQUFVLEVBQUUsTUFBTTthQUNuQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEluamVjdGFibGUsIEluamVjdG9yIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xuaW1wb3J0IHsgTG9jYXRpb24gfSBmcm9tICdAYW5ndWxhci9jb21tb24nO1xuXG5ASW5qZWN0YWJsZSh7XG4gIHByb3ZpZGVkSW46ICdyb290Jyxcbn0pXG5leHBvcnQgY2xhc3MgQWJzdHJhY3ROYXZpZ2F0b3Ige1xuICBwcml2YXRlIHJlYWRvbmx5IHJvdXRlcj86IFJvdXRlcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGxvY2F0aW9uOiBMb2NhdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucm91dGVyID0gaW5qZWN0b3IuZ2V0KFJvdXRlcik7XG4gICAgfSBjYXRjaCB7fVxuICB9XG5cbiAgLyoqXG4gICAqIE5hdmlnYXRlcyB0byB0aGUgc3BlY2lmaWVkIHVybC4gVGhlIHJvdXRlciB3aWxsIGJlIHVzZWQgaWYgb25lIGlzIGF2YWlsYWJsZSwgb3RoZXJ3aXNlIGl0IGZhbGxzIGJhY2tcbiAgICogdG8gYHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZWAuXG4gICAqIEBwYXJhbSB1cmwgVGhlIHVybCB0byBuYXZpZ2F0ZSB0b1xuICAgKi9cbiAgbmF2aWdhdGVCeVVybCh1cmw6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICh0aGlzLnJvdXRlcikge1xuICAgICAgdGhpcy5yb3V0ZXIubmF2aWdhdGVCeVVybCh1cmwpO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5sb2NhdGlvbi5yZXBsYWNlU3RhdGUodXJsKTtcbiAgfVxufVxuIl19
