import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import adoption from "../images/adoption.png";
import shelter from "../images/animal-shelter.png";

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <script src="https://kit.fontawesome.com/4f6ef2ad0d.js" crossOrigin="anonymous"></script>
            </Head>
            <div className="wrapper flex flex-col min-h-screen justify-center p-5 md:py-5 md:px-10 text-center leading-[1.2] text-black dark:text-white">
                <div className="group-title mb-5 lg:w-1/2 lg:mx-auto">
                    <h1 className="title font-bold mb-5 text-4xl md:text-5xl lg:text-6xl">
                    Welcome to PetCare
                    {""} <i className="fa-solid fa-paw"></i>
                    </h1>
                    <p className="subtitle text-[14px] md:text-[20px]">
                    Connect loving pets with caring families. Whether you're a shelter
                    looking to find homes for animals or someone ready to adopt, you're in
                    the right place.
                    </p>
                </div>
                <div className="selection flex flex-col flex-wrap justify-center items-center md:flex-row mx-auto gap-5 w-70 md:w-180">
                    <Link
                        prefetch
                        href={auth.user ? '/profile' : login()}
                        className="box flex-1 border p-3 rounded-3xl hover:scale-105 transition-transform duration-300 cursor-pointer border-blackff dark:border-white"
                    >
                        <img className="img w-25 mx-auto md:w-30" src={shelter} alt="" />
                        <h1 className="title-selection font-bold md:text-2xl">Shelter</h1>
                        <p className="subtitle-selection text-[14px] md:text-[17px]">
                            Animal shelters and rescue organizations. Create an account to post
                            pets looking for homes.
                        </p>
                    </Link>
                    <Link
                        prefetch
                        href='/adoption'
                        className="box flex-1 border p-3 rounded-3xl hover:scale-105 transition-transform duration-300 cursor-pointer border-black dark:border-white"
                    >
                        <img className="img w-25 mx-auto md:w-30" src={adoption} alt="" />
                        <h1 className="title-selection font-bold md:text-2xl">Adopter</h1>
                        <p className="subtitle-selection text-[14px] md:text-[17px]">
                            Looking for a new companion? Browse available pets from local
                            shelters. No account needed!
                        </p>
                    </Link>
                </div>
            </div>
        </>
    );
}
