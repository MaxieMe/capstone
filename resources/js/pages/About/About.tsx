import { Head, router } from '@inertiajs/react';

export default function About() {
  const handleExit = () => {
    router.visit('/profile'); // Redirect to Profile page
  };

  return (
    <>
      <Head title="About Us" />
      {/* Background container */}
      <div
        className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-no-repeat px-6 text-center"
        style={{ backgroundImage: "url('/images/welcome-bg.jpg')" }}
      >
        {/* Main content container */}
        <div className="max-w-3xl bg-white bg-opacity-80 p-8 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">About Us</h2>

          <p className="mb-4 text-gray-700">
            <strong>Welcome To PetCare</strong> — Our website is the dedicated online platform created to
            simplify pet adoption and amplify rescue efforts in Tanay. We are the bridge connecting deserving
            animals with loving families.
          </p>

          <h3 className="font-semibold text-lg mt-6 mb-2 text-gray-800">Our Core Belief</h3>
          <p className="mb-4 text-gray-700">
            Every pet deserves a safe, permanent home. We built this platform to make that happen efficiently
            and safely.
          </p>

          <h3 className="font-semibold text-lg mt-6 mb-2 text-gray-800">Our Promise to You</h3>
          <p className="mb-3 text-gray-700">
            <strong>Trusted Shelter/Rescuers Only:</strong> We partner exclusively with vetted, ethical shelters
            and rescue organizations. This ensures you are adopting responsibly.
          </p>

          <p className="mb-3 text-gray-700">
            <strong>Simplified Searching:</strong> We bring thousands of adoptable pets into one easy-to-use
            site, cutting down the time it takes to find your perfect match.
          </p>

          <p className="mb-3 text-gray-700">
            <strong>Impact:</strong> When you adopt through our platform, you are directly supporting the rescue
            mission and saving a life.
          </p>

          <p className="text-gray-700">
            We are here to guide you through a rewarding adoption journey and help you welcome your new family
            member home.
          </p>

          {/* Back button inside the container */}
          <button
            onClick={handleExit}
            className="mt-6 bg-purple-600 text-white px-5 py-2 rounded-md shadow-md hover:bg-purple-700 transition"
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
}
