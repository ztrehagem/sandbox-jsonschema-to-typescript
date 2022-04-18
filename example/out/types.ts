export interface StatusResponse<S extends number = number> extends Response {
  status: S;
}

export interface JsonResponse<S extends number = number, T = unknown>
  extends StatusResponse<S> {
  arrayBuffer(): never;
  blob(): never;
  formData(): never;
  json(): Promise<T>;
  text(): never;
}
