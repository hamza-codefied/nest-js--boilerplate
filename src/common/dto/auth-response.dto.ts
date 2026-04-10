export class AuthResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}