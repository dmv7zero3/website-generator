import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Store,
} from "lucide-react";

const stores = [
  {
    id: "dc",
    name: "SLS Dispensary DC",
    location: "Washington, DC",
    googleUrl:
      "https://www.google.com/maps/place/SLS+DC+Weed+Dispensary/@38.9000446,-77.0027354,17z",
  },
  {
    id: "towson",
    name: "SLS Dispensary Towson",
    location: "Towson, MD",
    googleUrl:
      "https://www.google.com/maps/place/Street+Lawyer+Services+-+Baltimore+Location/@39.288204,-76.6150084,17z",
  },
];

export function LocalSEOPhotos() {
  const [selectedStore, setSelectedStore] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
  });

  const removeFile = (index: number) => {
    setUploadedFiles((files) => files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedStore || uploadedFiles.length === 0) return;

    setUploading(true);
    try {
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would typically send the files to your backend
      console.log("Uploading files for store:", selectedStore);

      // Clear files after successful upload
      setUploadedFiles([]);
      setUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Local SEO Photos</h1>
        <p className="text-muted-foreground">
          Upload photos to your Google Business Profile
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Select Location
          </CardTitle>
          <CardDescription>
            Choose which store location to upload photos for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Select a store location..." />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name} - {store.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Upload Photos
          </CardTitle>
          <CardDescription>
            Drag and drop photos or click to select files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <div>
                <p className="text-lg font-medium">
                  Drop photos here or click to select
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports JPG, PNG and GIF up to 5MB each
                </p>
              </div>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  Selected Photos ({uploadedFiles.length})
                </h3>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedStore || uploading}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload to Google
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                    <p className="mt-1 text-sm truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedStore && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
              <AlertCircle className="w-4 h-4" />
              <p>
                Photos will be uploaded to the Google Business Profile for{" "}
                <span className="font-medium">
                  {stores.find((store) => store.id === selectedStore)?.name}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LocalSEOPhotos;
