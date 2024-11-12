"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useFormik } from "formik";
import { useState } from "react";
import { TextInput } from "@/components/widgets/textInput";
import { eventValidationSchema } from "@/lib/validation/event";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { uploadFile } from "@/lib/api/uploadFile";
import Spinner from "@/components/ui/spinner";
import { createEvent } from "@/lib/api/events.Fn";
import { toast } from "sonner";
import { useOrganizationUnits } from "@/hooks/useOrganizationUnit";

export default function AddNewEvent() {
  const [isOpened, setIsOpened] = useState(false);

  const formik = useFormik({
    initialValues: {
      logo: null,
      title: "",
      organizationUnit: "",
      description: "",
    },
    validationSchema: eventValidationSchema,
    onSubmit: async (values) => {
      let msg = toast.loading("Uploading Event Logo...");

      if (!values.logo) {
        formik.setFieldError("logo", "Event logo is required");
        return;
      }
      const data = await uploadFileMutation({
        buffer: values.logo,
        key: (values.logo as File)?.name ?? "",
      }).catch(() => {
        toast.error("An error occurred while uploading the event logo.", {
          id: msg,
        });
        return null;
      });

      if (!data) return;

      msg = toast.loading("Creating Event...", {
        id: msg,
      });
      await createEventMutation({
        title: values.title,
        organizationUnitId: values.organizationUnit,
        description: values.description,
        image: data.filename,
      })
        .then(() => {
          toast.success("Event has been created.", {
            id: msg,
          });
        })
        .catch(() => {
          toast.error("An error occurred while creating the event.", {
            id: msg,
          });
        });
    },
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    if (isCreatingEvent || isUploading) return;

    const file = event.target.files?.[0];
    if (file) {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      setLogoUrl(URL.createObjectURL(file));
      formik.setFieldValue("logo", file);
    }
  };

  const {
    data: organizationUnits,
    isLoading: isOrganizationUnitsLoading,
    isError: isOrganizationUnitsError,
    refetch: refetchOrganizationUnits,
  } = useOrganizationUnits({
    withEvents: false,
  });

  const { mutateAsync: uploadFileMutation, isPending: isUploading } =
    useMutation({
      mutationFn: uploadFile,
    });

  const { mutateAsync: createEventMutation, isPending: isCreatingEvent } =
    useMutation({
      mutationFn: createEvent,
      onSuccess: () => {
        setIsOpened(false);
        formik.resetForm();
        setLogoUrl(null);
      },
    });

  return (
    <Dialog open={isOpened} onOpenChange={setIsOpened}>
      <Button
        onClick={() => {
          setIsOpened(true);
        }}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add New Event
      </Button>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
        </DialogHeader>
        {isOrganizationUnitsLoading ? (
          <div className="flex justify-center items-center py-10">
            <Spinner size={30} />
          </div>
        ) : isOrganizationUnitsError ? (
          <div className="text-center text-red-600 flex flex-col gap-5 justify-center items-center py-10">
            An error occurred while fetching organization units.
            <Button
              onClick={() => {
                refetchOrganizationUnits();
              }}
              className="w-min rounded-full px-6"
            >
              Retry
            </Button>
          </div>
        ) : (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="logo" className="block mb-2">
                Event Logo
              </Label>
              <div className="flex items-center justify-center">
                <Label
                  htmlFor="logo"
                  className={cn(
                    "cursor-pointer flex items-center justify-center w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-300 border-dashed hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                    formik.errors.logo && "border-red-600"
                  )}
                >
                  {formik.values.logo || logoUrl ? (
                    <Image
                      src={logoUrl ?? ""}
                      alt="Event logo"
                      className="w-full h-full object-contain rounded-full"
                      height={24}
                      width={24}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Upload event logo"
                    disabled={isCreatingEvent || isUploading}
                  />
                </Label>
              </div>
              <div className="text-center text-xs text-red-600">
                {formik.touched.logo && formik.errors.logo}
              </div>
            </div>

            <TextInput
              id="title"
              name="title"
              label="Event Title"
              value={formik.values.title}
              onChange={formik.handleChange}
              placeholder="Enter event title"
              errorMessage={(formik.touched.title && formik.errors.title) || ""}
              disabled={isCreatingEvent || isUploading}
            />
            <div>
              <Label htmlFor="organizationUnit">Organization Unit</Label>
              <Select
                name="organizationUnit"
                value={formik.values.organizationUnit}
                onValueChange={(value) => {
                  formik.setFieldValue("organizationUnit", value);
                }}
                disabled={isCreatingEvent || isUploading}
              >
                <SelectTrigger id="organizationUnit">
                  <SelectValue placeholder="Select organization unit" />
                </SelectTrigger>
                <SelectContent>
                  {(organizationUnits ?? []).map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-red-600">
                {formik.touched.organizationUnit &&
                  formik.errors.organizationUnit}
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Enter a brief description of the event"
                rows={3}
                disabled={isCreatingEvent || isUploading}
              />
              <div className="text-xs text-red-600">
                {formik.touched.description && formik.errors.description}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isUploading || isCreatingEvent}
            >
              {isUploading || isCreatingEvent ? <Spinner /> : "Add Event"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
