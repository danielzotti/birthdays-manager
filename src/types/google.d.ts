// Global declarations for Google Identity Services and Google Client / Picker APIs

declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
        error_uri?: string;
      }

      interface TokenClient {
        requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
      }

      function initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: unknown) => void;
        prompt?: string;
      }): TokenClient;

      function revoke(accessToken: string, done?: () => void): void;
    }
  }

  namespace picker {
    enum ViewId {
      SPREADSHEETS = 'spreadsheets',
      DOCS = 'all',
    }

    enum Action {
      PICKED = 'picked',
      CANCEL = 'cancel',
    }

    enum Document {
      ID = 'id',
      NAME = 'name',
    }

    interface ResponseObject {
      [key: string]: unknown;
      action: Action;
      docs?: Array<{
        [key: string]: unknown;
        id: string;
        name: string;
        url: string;
      }>;
    }

    class DocsView {
      constructor(viewId?: ViewId);
      setIncludeFolders(include: boolean): DocsView;
      setSelectFolderEnabled(enabled: boolean): DocsView;
      setMimeTypes(mimeTypes: string): DocsView;
    }

    class PickerBuilder {
      constructor();
      addView(view: ViewId | DocsView): PickerBuilder;
      setOAuthToken(token: string): PickerBuilder;
      setDeveloperKey(key: string): PickerBuilder;
      setCallback(callback: (data: ResponseObject) => void): PickerBuilder;
      setTitle(title: string): PickerBuilder;
      build(): Picker;
    }

    interface Picker {
      setVisible(visible: boolean): void;
    }
  }
}

declare namespace gapi {
  function load(feature: string, callback: () => void): void;

  namespace client {
    function init(args: { apiKey?: string; discoveryDocs?: string[] }): Promise<void>;
    function setToken(token: { access_token: string } | null): void;
    function getToken(): { access_token: string } | null;

    namespace sheets {
      namespace spreadsheets {
        namespace values {
          function get(params: {
            spreadsheetId: string;
            range: string;
          }): Promise<{
            result: {
              values?: unknown[][];
            };
          }>;

          function update(params: {
            spreadsheetId: string;
            range: string;
            valueInputOption: 'RAW' | 'USER_ENTERED';
            resource: {
              values: unknown[][];
            };
          }): Promise<{
            result: unknown;
          }>;
        }
      }
    }
  }
}

interface Window {
  google?: typeof google;
  gapi?: typeof gapi;
}
