const NotFoundPage = () => {
    return (
        <section className="bg-blue-50 min-h-screen flex-grow">
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center">
                <h1 className="text-4xl font-bold text-gray-800">Page Not Found</h1>
                <p className="text-xl text-gray-600 mt-4">The page you are looking for does not exist.</p>
                <a href="/" className="mt-6 px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition">
                Go Home
                </a>
            </div>
        </section>
    );
  };
  
  export default NotFoundPage;