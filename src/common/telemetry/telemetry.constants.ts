export const TELEMETRY_CONSTANTS = {
  SERVICE_NAME: 'todo-post-service',
  MAX_RESULT_SIZE: 1000,
  SENSITIVE_FIELDS: ['password', 'token', 'secret', 'key', 'authorization'],
  SPAN_ATTRIBUTES: {
    ERROR: {
      TYPE: 'error.type',
      MESSAGE: 'error.message',
      STACK: 'error.stack',
    },
    HTTP: {
      METHOD: 'http.method',
      ROUTE: 'http.route',
      STATUS_CODE: 'http.status_code',
      REQUEST_SIZE: 'http.request.size',
      RESPONSE_SIZE: 'http.response.size',
      CLIENT_IP: 'http.client_ip',
      USER_AGENT: 'http.user_agent',
    },
    FUNCTION: {
      NAME: 'function.name',
      ARGUMENTS: 'function.arguments',
      RESULT: 'function.result',
    },
  },
};
