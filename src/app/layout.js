import './globals.css';

export const metadata = {
  title: 'PDF Processor',
  description: 'Process PDFs with local Ollama embeddings',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans bg-gray-100">
        {children}
      </body>
    </html>
  );
}