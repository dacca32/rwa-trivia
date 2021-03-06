import { Injectable, PLATFORM_ID, APP_ID, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, defer, throwError, from, of } from 'rxjs';
import { share, take, tap, mapTo, map, filter } from 'rxjs/operators';
import { CoreState, coreState } from '../store';
import { User } from '../../shared/model';
import { UserActions, UIStateActions } from '../store/actions';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FirebaseAuthService } from './firebase-auth.service';

@Injectable()
export class AuthenticationProvider {

  refreshTokenObserver: Observable<any>;
  user: User;

  constructor(private store: Store<CoreState>,
    private userActions: UserActions,
    private uiStateActions: UIStateActions,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(APP_ID) private appId: string,
    private firebaseAuthService: FirebaseAuthService) {

    this.firebaseAuthService.authState().subscribe(afUser => {
      if (afUser) {
        this.firebaseAuthService.getIdToken(afUser, false).then((token) => {
          this.user = new User(afUser);
          this.user.idToken = token;
          this.store.dispatch(this.userActions.loginSuccess(this.user));
        });
      } else {
        // user not logged in
        this.store.dispatch(this.userActions.logoff());
      }
    });

    this.refreshTokenObserver = defer(() => {
      return from(this.generateToken(true));
    }).pipe(share());


  }

  ensureLogin(url?: string): Observable<boolean> {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.isAuthenticated) {
        this.showLogin(url);
      }
    } else if (!isPlatformServer(this.platformId) && !isPlatformBrowser(this.platformId)) {
      if (!this.isAuthenticated) {
        this.showLogin(url);
        return of(false);
      }
    }
    return this.store.select(coreState).pipe(
      map(s => s.user),
      filter(u => (u != null && u.userId !== '')),
      take(1),
      mapTo(true));

  }
  generateToken(flag) {
    return this.firebaseAuthService.refreshToken(flag).then((token) => {
      return token;
    });

  }


  refreshToken(): Observable<any> {
    return this.refreshTokenObserver.pipe(tap((tokenResponse) => {
      this.user.idToken = tokenResponse;
      this.store.dispatch(this.userActions.loginSuccess(this.user));
      return tokenResponse;
    },
      (err) => {
        return throwError(err);
      }));
  }


  showLogin(url?: string) {
    this.store.dispatch(this.uiStateActions.setLoginRedirectUrl(url));
    this.firebaseAuthService.showLogin();

  }

  logout() {
    this.firebaseAuthService.signOut();
  }

  get isAuthenticated(): boolean {
    let user: User;
    this.store.select(coreState).pipe(take(1)).subscribe(s => user = s.user);
    if (user) {
      return true;
    }
    return false;
  }

}
