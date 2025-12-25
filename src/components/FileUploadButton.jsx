import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FileUploadButton({ onUploadSuccess, accept = "*", children, className }) {
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `uploads/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('public-files')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('public-files')
                .getPublicUrl(filePath);

            toast.success('File uploaded successfully!');
            onUploadSuccess?.(publicUrl, filePath);
        } catch (error) {
            toast.error('Failed to upload file');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input
                type="file"
                id="file-upload"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
            />
            <label htmlFor="file-upload">
                <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    className={className}
                    asChild
                >
                    <span>
                        {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {children || (uploading ? 'Uploading...' : 'Upload File')}
                    </span>
                </Button>
            </label>
        </div>
    );
}