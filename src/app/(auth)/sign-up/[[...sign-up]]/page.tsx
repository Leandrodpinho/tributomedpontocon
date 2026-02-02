import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <SignUp
                appearance={{
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'bg-slate-900 border border-slate-800 shadow-2xl',
                        headerTitle: 'text-white',
                        headerSubtitle: 'text-slate-400',
                        formFieldLabel: 'text-slate-300',
                        formFieldInput: 'bg-slate-800 border-slate-700 text-white',
                        formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
                        footerActionLink: 'text-blue-400 hover:text-blue-300',
                    }
                }}
            />
        </div>
    );
}
