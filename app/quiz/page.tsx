import QuizComponent from './../components/QuizComponent';

export const metadata = {
  title: 'Free Curly Hair Diagnostic | Get Your 90-Day Protocol',
  description: 'Identify your hair type and porosity in 2 minutes. Get a custom science-backed routine to transform your curls.',
  openGraph: {
    title: 'Stop Guessing. Start Growing. | Curl Diagnostic',
    description: 'I just finished my hair diagnostic. Take the quiz to get your custom 90-day protocol.',
    type: 'website',
    // Once you have your domain, you'll put the full URL here
    url: 'https://yourdomain.com/quiz', 
    images: [
      {
        url: '/og-image.jpg', // Place an image with this name in your /public folder later
        width: 1200,
        height: 630,
        alt: 'Curly Hair Diagnostic Tool Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Curly Hair Routine Diagnostic',
    description: 'Get your custom-built prescription in under 2 minutes.',
  },
};

export default function HairQuizPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-20 px-4">
      <div className="max-w-xl w-full text-center mb-10">
        <h1 className="text-3xl font-serif font-bold text-slate-900">
          Curly Hair Routine Diagnostic
        </h1>
        <p className="text-slate-500 mt-2">
          Get your custom-built prescription in under 2 minutes.
        </p>
      </div>
      <QuizComponent />
    </main>
  );
}