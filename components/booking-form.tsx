"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudioPolicies } from "@/components/studio-policies";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { BookingFormProps, Service } from "@/types/types";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function BookingForm({
  formData,
  setFormData,
  date,
  handleDateSelect,
  fullyBookedDates,
  step,
  isSubmitting,
  handleSubmit,
  handleSelectChange,
  availableSlotsForSelectedDate,
  unavailableSlots,
  formatTime,
  isPaying,
  agreedToTerms,
  setAgreedToTerms,
  handlePayment,
  setStep,
}: BookingFormProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Failed to fetch services", error);
      }
    };

    fetchServices();
  }, []);

  const categories = React.useMemo(() => {
    if (services.length === 0) return [];
    const cats = services.map((s) => s.category);
    return Array.from(new Set(cats));
  }, [services]);

  const filteredServices = React.useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter((s) => s.category === selectedCategory);
  }, [services, selectedCategory]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      try {
        const response = await fetch(
          `/api/bookings/upload?filename=${file.name}`,
          {
            method: "POST",
            body: file,
          }
        );
        const newBlob = await response.json();
        setFormData((prev: any) => ({
          ...prev,
          inspirationPhotos: [...(prev.inspirationPhotos || []), newBlob.url],
        }));
      } catch (error) {
        console.error("Failed to upload file", error);
      }
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-none overflow-hidden shadow-soft">
      <div className="grid md:grid-cols-2">
        <div className="relative bg-gray-100 p-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/IMG_9067.png')" }}
          >
            <div className="absolute inset-0 bg-black opacity-40"></div>
          </div>
          <div className="relative z-10 text-white">
            <h3 className="text-3xl font-serif mb-6">Business Hours</h3>
            <div className="space-y-3 text-lg font-light">
              <div className="flex justify-between border-b border-gray-400 py-2">
                <span>Mon - Thu</span>
                <span>8:30 - 16:30</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 py-2">
                <span>Friday</span>
                <span>8:30 - 15:00</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 py-2">
                <span>Saturday</span>
                <span>10:00 - 15:00</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 py-2">
                <span>Sunday</span>
                <span>Closed</span>
              </div>
            </div>
            <div className="mt-8">
              <h4 className="text-2xl font-serif mb-4">Loyalty Program</h4>
              <p className="text-gray-200">
                Your{" "}
                <span className="font-semibold text-white">
                  6th booking comes with a 30% discount
                </span>{" "}
                as a thank you for your continued trust in us.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white">
          <CardHeader className="p-0 mb-6 text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {step === "form" ? "Book Your Slot" : "Confirm & Pay"}
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {step === "form"
                ? "A K10,000 non-refundable deposit is required."
                : "Review your details and pay the booking fee."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    id="name"
                    name="name"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                  />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                  />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                />

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <Label className="text-base font-medium text-gray-900">
                    Select Service Category
                  </Label>
                  <Select
                    onValueChange={setSelectedCategory}
                    value={selectedCategory || ""}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 border-gray-200">
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="focus:bg-brand-pink/10"
                        >
                          {category
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-gray-900">
                      Select Services
                    </Label>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={`service-${service.id}`}
                            name="services"
                            value={service.id}
                            checked={formData.services.includes(service.id)}
                            disabled={!service.isAvailable}
                            onCheckedChange={() => {
                              const newServices = formData.services.includes(
                                service.id
                              )
                                ? formData.services.filter(
                                    (s: any) => s !== service.id
                                  )
                                : [...formData.services, service.id];
                              setFormData((prev: any) => ({
                                ...prev,
                                services: newServices,
                              }));
                            }}
                          />
                          <Label
                            htmlFor={`service-${service.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {service.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.services.length > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium text-gray-900">
                      Selected Services
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.services.map((serviceId: string) => {
                        const service = services.find(s => s.id === serviceId);
                        if (!service) return null;
                        return (
                          <Badge
                            key={service.id}
                            variant="default"
                            className="bg-brand-pink/10 text-brand-pink border-brand-pink/20 flex items-center gap-2 rounded-full px-3 py-1 text-sm font-normal"
                          >
                            <span>{service.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newServices = formData.services.filter(
                                  (s: any) => s !== serviceId
                                );
                                setFormData((prev: any) => ({
                                  ...prev,
                                  services: newServices,
                                }));
                              }}
                              className="rounded-full hover:bg-black/10 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <Label className="text-base font-medium text-gray-900 col-span-full">
                    Select Date & Time
                  </Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-gray-50 border-gray-300",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? (
                            format(date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateSelect}
                          initialFocus
                          disabled={(d) => fullyBookedDates.some(
                            (bookedDate) =>
                              new Date(d).toDateString() ===
                              new Date(bookedDate).toDateString()
                          )}
                        />
                      </PopoverContent>
                    </Popover>

                    <Select
                      value={formData.timeSlot}
                      onValueChange={(value) =>
                        handleSelectChange("timeSlot", value)
                      }
                      disabled={!date}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink">
                        <SelectValue placeholder="Select a time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white text-gray-900 border-gray-200">
                        {date && availableSlotsForSelectedDate.length > 0 ? (
                          availableSlotsForSelectedDate.map((slot: any) => {
                            const isUnavailable =
                              unavailableSlots.includes(slot);
                            return (
                              <SelectItem
                                key={slot}
                                value={slot}
                                disabled={isUnavailable}
                                className="focus:bg-brand-pink/10"
                              >
                                {formatTime(slot)}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            {date
                              ? "No slots available."
                              : "Select a date first."}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Additional Notes (Optional)"
                  value={formData.notes}
                  onChange={handleChange}
                  className="bg-gray-50 border-gray-300 text-gray-900 rounded-md focus:ring-brand-pink focus:border-brand-pink"
                />

                <div className="space-y-4">
                  <Label className="text-base font-medium text-gray-900">
                    Inspiration Photo (Optional)
                  </Label>
                  <FileUpload
                    onChange={handleFileChange}
                    uploadedFiles={formData.inspirationPhotos}
                  />
                </div>

                <div className="items-top flex space-x-2 pt-4 border-t border-gray-200">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(checked as boolean)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the studio policies
                    </label>
                    <StudioPolicies />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors"
                  disabled={
                    isSubmitting ||
                    !agreedToTerms ||
                    !formData.date ||
                    formData.services.length === 0 ||
                    !formData.timeSlot
                  }
                >
                  {isSubmitting ? "Submitting..." : "Proceed to Pay"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold">Review Your Booking</h3>
                  <p className="text-sm text-gray-500">
                    Please confirm the details below before payment.
                  </p>
                </div>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex justify-between">
                    <span>Full Name:</span>{" "}
                    <strong className="text-gray-900">{formData.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone:</span>{" "}
                    <strong className="text-gray-900">{formData.phone}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>{" "}
                    <strong className="text-gray-900">
                      {formData.date ? format(new Date(formData.date), "PPP") : ""}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Slot:</span>{" "}
                    <strong className="text-gray-900">
                      {formatTime(formData.timeSlot)}
                    </strong>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Notes:</p>
                    <p className="text-sm text-gray-600">
                      {formData.notes || "N/A"}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setStep("form")}
                  variant="outline"
                  className="w-full"
                >
                  Go Back & Edit
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full bg-green-500 text-white hover:bg-green-600"
                >
                  {isPaying ? "Processing..." : "Pay K10,000 Now"}
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
} 