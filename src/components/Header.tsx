import Image from "next/image"
export default function Header() {

    return (
        <header className="flex items-center justify-between">
            <div className="flex items-end">
                <div className="relative flex w-20 h-20">
                    <Image src="/logo.png" fill alt="logo" />
                </div>
                <div className="relative flex w-40 h-10 items-center justify-center mb-[2px] ml-[-14px]">
                    <Image src="/letterlogo.svg" fill alt="letterlogo" />
                </div>
            </div>
        </header>
    )
}