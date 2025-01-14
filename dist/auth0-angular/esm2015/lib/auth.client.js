import { __rest } from 'tslib';
import { InjectionToken } from '@angular/core';
import { Auth0Client } from '@auth0/auth0-spa-js';
import useragent from '../useragent';
export class Auth0ClientFactory {
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
export const Auth0ClientService = new InjectionToken('auth0.client');
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5jbGllbnQuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vLi4vcHJvamVjdHMvYXV0aDAtYW5ndWxhci9zcmMvIiwic291cmNlcyI6WyJsaWIvYXV0aC5jbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDL0MsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRWxELE9BQU8sU0FBUyxNQUFNLGNBQWMsQ0FBQztBQUVyQyxNQUFNLE9BQU8sa0JBQWtCO0lBQzdCLE1BQU0sQ0FBQyxZQUFZLENBQUMsYUFBK0I7UUFDakQsTUFBTSxNQUFNLEdBQUcsYUFBYSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRW5DLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLElBQUksS0FBSyxDQUNiLG1HQUFtRyxDQUNwRyxDQUFDO1NBQ0g7UUFFRCxNQUFNLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsZUFBZSxLQUFjLE1BQU0sRUFBZixJQUFJLFVBQUssTUFBTSxFQUFwRSx3REFBMkQsQ0FBUyxDQUFDO1FBRTNFLE9BQU8sSUFBSSxXQUFXLCtCQUNwQixZQUFZLEVBQUUsV0FBVyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUNuRCxTQUFTLEVBQUUsUUFBUSxFQUNuQixPQUFPLEVBQUUsTUFBTSxJQUNaLElBQUksS0FDUCxXQUFXLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO2dCQUNwQixPQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU87YUFDM0IsSUFDRCxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRUQsTUFBTSxDQUFDLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxjQUFjLENBQ2xELGNBQWMsQ0FDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0aW9uVG9rZW4gfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IEF1dGgwQ2xpZW50IH0gZnJvbSAnQGF1dGgwL2F1dGgwLXNwYS1qcyc7XG5pbXBvcnQgeyBBdXRoQ2xpZW50Q29uZmlnIH0gZnJvbSAnLi9hdXRoLmNvbmZpZyc7XG5pbXBvcnQgdXNlcmFnZW50IGZyb20gJy4uL3VzZXJhZ2VudCc7XG5cbmV4cG9ydCBjbGFzcyBBdXRoMENsaWVudEZhY3Rvcnkge1xuICBzdGF0aWMgY3JlYXRlQ2xpZW50KGNvbmZpZ0ZhY3Rvcnk6IEF1dGhDbGllbnRDb25maWcpOiBBdXRoMENsaWVudCB7XG4gICAgY29uc3QgY29uZmlnID0gY29uZmlnRmFjdG9yeS5nZXQoKTtcblxuICAgIGlmICghY29uZmlnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdDb25maWd1cmF0aW9uIG11c3QgYmUgc3BlY2lmaWVkIGVpdGhlciB0aHJvdWdoIEF1dGhNb2R1bGUuZm9yUm9vdCBvciB0aHJvdWdoIEF1dGhDbGllbnRDb25maWcuc2V0J1xuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHJlZGlyZWN0VXJpLCBjbGllbnRJZCwgbWF4QWdlLCBodHRwSW50ZXJjZXB0b3IsIC4uLnJlc3QgfSA9IGNvbmZpZztcblxuICAgIHJldHVybiBuZXcgQXV0aDBDbGllbnQoe1xuICAgICAgcmVkaXJlY3RfdXJpOiByZWRpcmVjdFVyaSB8fCB3aW5kb3cubG9jYXRpb24ub3JpZ2luLFxuICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcbiAgICAgIG1heF9hZ2U6IG1heEFnZSxcbiAgICAgIC4uLnJlc3QsXG4gICAgICBhdXRoMENsaWVudDoge1xuICAgICAgICBuYW1lOiB1c2VyYWdlbnQubmFtZSxcbiAgICAgICAgdmVyc2lvbjogdXNlcmFnZW50LnZlcnNpb24sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBBdXRoMENsaWVudFNlcnZpY2UgPSBuZXcgSW5qZWN0aW9uVG9rZW48QXV0aDBDbGllbnQ+KFxuICAnYXV0aDAuY2xpZW50J1xuKTtcbiJdfQ==
