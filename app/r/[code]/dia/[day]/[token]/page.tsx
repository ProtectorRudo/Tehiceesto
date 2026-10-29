import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SevenDaysExperience from "@/components/SevenDaysExperience";
import { getPublishedGiftByCode } from "@/lib/gifts/repository";
import { validSevenDaysToken } from "@/lib/seven-days-links";

export const metadata:Metadata={
  title:"Una sorpresa especial para vos · Te Hice Esto",
  robots:{index:false,follow:false,nocache:true},
};
export const dynamic="force-dynamic";
export default async function PrivateSevenDaysChapter({
  params,
}:{
  params:Promise<{code:string;day:string;token:string}>
}) {
  const {code,day,token}=await params;
  const currentDay=Number(day);
  if(!validSevenDaysToken(code,currentDay,token))notFound();
  let gift;
  try {gift=await getPublishedGiftByCode(code);}
  catch (error) {
    if (error instanceof Error && error.message==="gift_not_found") notFound();
    throw error;
  }
  if(gift.experience.slug!=="siete-dias")notFound();
  return <SevenDaysExperience
    experience={gift.experience}
    sceneTextOverrides={gift.sceneTextOverrides}
    photoMedia={gift.photoMedia}
    audioMedia={gift.audioMedia}
    singleDay={currentDay}
  />;
}
