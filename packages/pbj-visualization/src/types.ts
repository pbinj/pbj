export interface ServiceI {
  name: string;
  description: string;
  dependencies: string[];
  invoked: boolean;
  invalid: boolean;
  optional: boolean;
  tags: string[];
  invokable: boolean;
  cacheable: boolean;
  primitive: boolean;
  listOf: boolean;
  error?: {
    message: string;
  };
  args: unknown[];
}
