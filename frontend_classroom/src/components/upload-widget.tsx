import React, {useEffect, useRef, useState} from 'react'
import {UploadWidgetValue} from "@/types";
import {UploadCloud} from "lucide-react";
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from "@/constants";

const UploadWidget = ({value=null, onChange, disabled = false}) => {

    const widgetRef = useRef<CloudinaryWidget | null>(null);
    const onChangeRef = useRef(onChange);

    const[preview,setPreview]=useState<UploadWidgetValue | null>(value);
    const [deleteToken, setDeleteToken] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<boolean>(false);

    useEffect(()=>{
        setPreview(value);
        if(!value) setDeleteToken(null);
        }
    ,[value])


    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if( typeof window === 'undefined') return;

        const initializeWidget = () => {
            if(!window.cloudinary || widgetRef.current) return false;

            widgetRef.current = window.cloudinary.createUploadWidget({
                cloudName : CLOUDINARY_CLOUD_NAME,
                uploadPreset : CLOUDINARY_UPLOAD_PRESET,
                multiple : false,
                folder: 'uploads',
                maxFiles: 1,
                maxFileSize: 500000,
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            }, (error, result)=>{
                if(!error && result.event === 'success') {
                    const payload: UploadWidgetValue = {
                        url: result.info.secure_url,
                        publicId: result.info.public_id,
                    }

                    setPreview(payload);

                    setDeleteToken(result.info.delete_token ?? null);

                    onChangeRef.current?.(payload);
                }



            });

            return true;
        }

        if(initializeWidget()) return;

        const invervalId = window.setInterval(()=>{
            if(initializeWidget()) {
                window.clearInterval(invervalId);
            }
        }, 500)

        return () => window.clearInterval(invervalId);

    }, []);


    const openWidget = () => {
        if (!disabled) widgetRef.current?.open();
    }

    const removeFromCloudinary = async () => {

    }

    return (
        <div className="space-y-2">
            {preview ? (
                <div className="upload-preview"></div>):


                <div className="upload-dropzone"
                     role="button"
                     tabIndex={0}
                     onClick={openWidget}
                     onKeyDown={(event)=>{
                         if(event.key === 'Enter') {
                             event.preventDefault();
                             openWidget();
                         }
                     }}
                >
                    <div className="upload-prompt">
                        <UploadCloud className="icon"/>
                        <div>
                            <p>Click or drag to upload photo</p>
                            <p>PNG, JPG, JPEG up to 5MB</p>
                        </div>

                    </div>

                </div>
            }
        </div>
    )
}
export default UploadWidget
