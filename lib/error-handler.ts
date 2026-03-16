export class SignUpErrorHandler {
    private getErrorMessage(error: string): string{
        switch(error){
            case 'Could not verify university email domain':
                return 'Please use a valid university email address';
            case 'Invalid email format':
                return 'The email address format is incorrect';
            case 'Failed to create user record':
                return 'Unable to create your account. Please try again later';
            case 'An unexpected error occurred':
                return 'Something went wrong. Please try again later';
            case 'User already exists':
                return 'A user with this email already exists';
            case 'Email already in use':
                return 'A user with this email already exists';
            default:
                return 'Failed to sign up. Please try again';
        }
    }

    public handleError(error: unknown): string {
        return error instanceof Error ? this.getErrorMessage(error.message) : 'Failed to sign up';
    }
}

export class LoginErrorHandler {
    private getErrorMessage(error: string): string {
        switch (error) {
            case 'Invalid login credentials':
                return 'Invalid login credentials';
            case 'An unexpected error occurred':
                return 'Something went wrong. Please try again later';
            case 'Error fetching user profile':
                return 'Failed to log in. Please try again later';
            default:
                return 'Failed to login. Please try again';
        }
    }

    public handleError(error: unknown): string {
        return error instanceof Error ? this.getErrorMessage(error.message) : 'Failed to login';
    }
}

export class ForgotPasswordLinkErrorHandler {

    private getErrorMessage(error: string): string {
        switch (error) {
            case 'An unexpected error occurred':
                return 'Something went wrong. Please try again later';
            case 'Error identifying user':
                return 'Your account can not be identified with the email provided. Please try again later';
            default:
                return 'Failed to reset password. Please try again';
        }   
    }

    public handleError(error: unknown): string {
        return error instanceof Error ? this.getErrorMessage(error.message) : 'Failed to reset password';
    }
}
export class ForgotPasswordErrorHandler {
    private getErrorMessage(error: string): string {
        switch (error) {
            case 'An unexpected error occurred':
                return 'Something went wrong. Please try again later';
            case 'New password should be different from the old password.':
                return 'New password should be different from the old password. Please try again.';
            case 'Failed to Rest Pssword':
                return 'Failed to reset password. Please try again';
            default:
                return 'Failed to reset password. Please try again';
        }   
    }

    public handleError(error: unknown): string {
        return error instanceof Error ? this.getErrorMessage(error.message) : 'Failed to reset password';
    }
}