import { WsAppStateService } from './../ws-app-state.service';
import { WsAuthRequest } from './ws-auth-request';
import { Subject } from 'rxjs/Subject';
import { WsMamConnection } from './../shared/services/ws-base-mam/ws-mam-connection';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { WsBaseMamService } from './../shared/services/ws-base-mam/ws-base-mam.service';
import { Injectable } from '@angular/core';
import { WsMamError } from '../shared/services/ws-base-mam/ws-mam-error';

@Injectable()
export class WsLoginService { //extends WsBaseMamService {
  private connectionInfo: WsMamConnection;
  public loginSubject: Subject<any> = new Subject<any>();

  constructor(
    protected httpClient: HttpClient,
    protected appState: WsAppStateService) {
    // super(httpClient, appState);
  }

  public login(connectionInfo: WsMamConnection) {
    this.connectionInfo = connectionInfo;

    const authRequest = new WsAuthRequest();
    authRequest.casEndpoint = connectionInfo.casEndpoint;
    authRequest.database = connectionInfo.dbName;
    authRequest.server = connectionInfo.dbServer;
    authRequest.product = 'CinegyWorkspace';
    authRequest.productLicense = '{705EADF7-EAAD-4f7c-8141-862C2C511A61}';
    authRequest.productVersion = '1.0';

    const authHeader = btoa(`${this.connectionInfo.domain}/${this.connectionInfo.username}:${this.connectionInfo.password}`);
    const headers = new HttpHeaders()
      .append('Content-Type', 'application/json')
      .append('Authorization', `Basic ${authHeader}`);

    this.httpClient
      .post(`${this.connectionInfo.mamEndpoint}/authentication`, authRequest, { headers: headers })
      .subscribe(
      data => {
        this.loginSubject.next(data);
      },
      (err: HttpErrorResponse) => {
        this.handleError(err, this.loginSubject);
      }
      );
  }

  public logout() {
    this.appState.setConnectionState(false, null);
    console.log(`${this.connectionInfo.username} logged out`);
  }

  private handleError(err: HttpErrorResponse, subject: Subject<any>, extraSubjectData?: any) {
    const mamError = new WsMamError();

    if (!err.error || !err.error.error) {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      mamError.msg = `Backend returned code ${err.status}, message was: ${err.message}`;
      mamError.status = err.status;
      console.log(mamError.msg);
    } else if (err.error instanceof Error) {
      // A client-side or network error occurred. Handle it accordingly.
      mamError.msg = err.error.message;
      console.log('An error occurred:', mamError.msg);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      mamError.msg = `Backend returned code ${err.status}, message was: ${err.error.error}`;
      mamError.status = err.status;
      console.log(mamError.msg);
    }

    if (extraSubjectData) {
      mamError.extMsg = extraSubjectData;
    }

    if (subject) {
      subject.next(mamError);
    }

  }

}
