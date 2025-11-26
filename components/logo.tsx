import Image from "next/image"

export default function Logo() {
  return (
    <div className="relative flex flex-col items-center py-2 px-4 text-center">
      <div className="absolute -top-5 right-0 w-14 sm:w-16 drop-shadow-lg">
        <Image
          src="/christmas-hat.png"
          alt="Holiday hat"
          width={64}
          height={64}
          className="w-full holiday-hat"
          priority
        />
      </div>

      <div className="absolute -left-3 top-6 w-10 opacity-90 drop-shadow-md hidden sm:block">
        <Image
          src="/christmas-icon.png"
          alt="Holiday ornament"
          width={40}
          height={40}
          className="w-full holiday-ornament"
          priority
        />
      </div>

      <div className="text-[10px] tracking-[0.5em] uppercase text-emerald-800/80 font-semibold">
        Holiday 2025
      </div>

      <div className="text-2xl font-serif tracking-[0.35em]">LAURYN</div>
      <div className="text-3xl font-serif italic tracking-wide text-[#B5122C]">luxe</div>
      <div className="text-[10px] tracking-[0.2em] mt-1 text-emerald-900/80">B E A U T Y &nbsp; S T U D I O</div>
      <div className="text-[8px] tracking-[0.3em] mt-0.5 text-gray-500">E S T D 2 0 2 2</div>
      <div className="mt-1 text-[9px] tracking-[0.45em] uppercase text-[#E54B4B]">
        S E A S O N &nbsp; O F &nbsp; S P A R K L E
      </div>
    </div>
  )
}
