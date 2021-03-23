import { ModuleWithProviders } from '@angular/core';
import { AuthConfig } from './auth.config';
import * as ɵngcc0 from '@angular/core';
export declare class AuthModule {
  /**
   * Initialize the authentication module system. Configuration can either be specified here,
   * or by calling AuthClientConfig.set (perhaps from an APP_INITIALIZER factory function).
   * @param config The optional configuration for the SDK.
   */
  static forRoot(config?: AuthConfig): ModuleWithProviders<AuthModule>;
  static ɵmod: ɵngcc0.ɵɵNgModuleDefWithMeta<AuthModule, never, never, never>;
  static ɵinj: ɵngcc0.ɵɵInjectorDef<AuthModule>;
}

//# sourceMappingURL=auth.module.d.ts.map
