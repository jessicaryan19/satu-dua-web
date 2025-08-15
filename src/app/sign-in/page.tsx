import CustomLabel from "@/components/form/custom-label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function SignInPage() {
    return (
        <div className="flex w-screen h-screen">
            <div className="w-1/2 h-full p-6">
                <div className="bg-accent w-full h-full rounded-4xl flex items-center justify-center p-12">
                    <div className="relative w-full h-full">
                        <Image
                            className="object-contain"
                            src="/login.svg"
                            alt="login"
                            fill
                        />
                    </div>
                </div>
            </div>



            <div className="flex flex-col gap-20 w-1/2 h-full justify-center items-center p-28">
                <div className="flex flex-col gap-2 items-center justify-center">
                    <CustomLabel type="title" className="text-primary text-center w-full">Bertugas Dengan Sigap,</CustomLabel>
                    <CustomLabel type="title" className="text-primary text-center w-full">Melayani Tanpa Ragu.</CustomLabel>
                    <CustomLabel type="subtitle" className="text-center w-full">Silahkan masuk untuk memulai.</CustomLabel>
                </div>

                <div className="flex flex-col gap-8 w-full">
                    <div className="flex flex-col gap-2 w-full">
                        <CustomLabel htmlFor="email">Email</CustomLabel>
                        <Input id="email" type="email" placeholder="Email" />
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                        <CustomLabel htmlFor="password">Password</CustomLabel>
                        <Input id="password" type="password" placeholder="Password" />
                    </div>
                </div>

                <Button className="w-full">Masuk</Button>
            </div>
        </div>
    )
}