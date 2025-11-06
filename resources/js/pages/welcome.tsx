import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import adoption from "../images/adoption.png";
import shelter from "../images/animal-shelter.png";
import welcomeBg from "/public/images/welcome-bg.jpg";

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <script src="https://kit.fontawesome.com/4f6ef2ad0d.js" crossOrigin="anonymous"></script>
            </Head>

            
            <div
                className="relative flex flex-col min-h-screen justify-center p-5 md:py-5 md:px-10 text-center leading-[1.2] text-black dark:text-white overflow-hidden"
                style={{
                    backgroundImage: `url(${welcomeBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Gradient Overlay - TINANGGAL ANG PURPLE COLORS */}
                <div 
                    // Pinalitan ang violet-600/60 via-purple-600/50 to-pink-500/40
                    // ng mas neutral (black) na kulay para walang purple.
                    className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70 dark:from-black/60 dark:via-black/70 dark:to-black/80 backdrop-blur-[2px]" 
                />

                {/* Content */}
                <div className="relative z-10">
                    <div className="group-title mb-5 lg:w-1/2 lg:mx-auto">
                        <h1 className="title font-bold mb-5 text-4xl md:text-5xl lg:text-6xl drop-shadow-md text-white">
                            Welcome to <span className="bg-gradient-to-r from-violet-200 to-pink-200 bg-clip-text text-transparent">PetCare</span>{" "}
                            <i className="fa-solid fa-paw text-pink-300"></i>
                        </h1>
                        <p className="subtitle text-[14px] md:text-[20px] text-gray-100 max-w-3xl mx-auto">
                            Connect loving pets with caring families. Whether you're a shelter
                            looking to find homes for animals or someone ready to adopt, you're in
                            the right place.
                        </p>
                    </div>

                    {/* Selection Boxes */}
                    <div className="selection flex flex-col flex-wrap justify-center items-center md:flex-row mx-auto gap-5 w-70 md:w-180">
                        {/* Shelter Box */}
                        <Link
                            prefetch
                            href={auth.user ? '/profile' : login()}
                            className="box flex-1 border p-5 rounded-3xl hover:scale-105 transition-transform duration-300 cursor-pointer border-white/40 bg-white/10 backdrop-blur-md shadow-lg hover:shadow-2xl"
                        >
                            <img className="img w-25 mx-auto md:w-30 mb-3" src={shelter} alt="Shelter" />
                            <h1 className="title-selection font-bold md:text-2xl text-white">Shelter</h1>
                            <p className="subtitle-selection text-[14px] md:text-[17px] text-gray-100">
                                Animal shelters and rescue organizations. Create an account to post
                                pets looking for homes.
                            </p>
                        </Link>

                        {/* Adopter Box */}
                        <Link
                            prefetch
                            href="/adoption"
                            className="box flex-1 border p-5 rounded-3xl hover:scale-105 transition-transform duration-300 cursor-pointer border-white/40 bg-white/10 backdrop-blur-md shadow-lg hover:shadow-2xl"
                        >
                            <img className="img w-25 mx-auto md:w-30 mb-3" src={adoption} alt="Adoption" />
                            <h1 className="title-selection font-bold md:text-2xl text-white">Adopter</h1>
                            <p className="subtitle-selection text-[14px] md:text-[17px] text-gray-100">
                                Looking for a new companion? Browse available pets from local
                                shelters. No account needed!
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}