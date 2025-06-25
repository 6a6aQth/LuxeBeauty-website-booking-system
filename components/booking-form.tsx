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
import { X } from 'lucide-react';
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
  bookedSlots,
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
        const response = await fetch('/api/services');
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error('Failed to fetch services', error);
      }
    };

    fetchServices();
  }, []);

  const categories = React.useMemo(() => {
    if (services.length === 0) return [];
    const cats = services.map(s => s.category);
    return Array.from(new Set(cats));
  }, [services]);

  const filteredServices = React.useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(s => s.category === selectedCategory);
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
            method: 'POST',
            body: file,
          }
        );
        const newBlob = await response.json();
        setFormData((prev: any) => ({
          ...prev,
          inspirationPhotos: [...(prev.inspirationPhotos || []), newBlob.url],
        }));
      } catch (error) {
        console.error('Failed to upload file', error);
      }
    }
  };

  return (
    <Card className="max-w-4xl mx-auto border-none shadow-2xl overflow-hidden">
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

        <div className="p-8 bg-gray-50">
          <CardHeader className="p-0 mb-6 text-center">
            <CardTitle className="text-3xl font-serif">
              {step === "form" ? "Book Your Slot" : "Confirm & Pay"}
            </CardTitle>
            <CardDescription>
              {step === "form"
                ? "A K10,000 non-refundable deposit is required."
                : "Review your details and pay the booking fee."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {step === "form" ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    id="name"
                    name="name"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white"
                  />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-white"
                  />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email Address (Optional)"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white"
                />

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Service Category
                  </Label>
                  <Select onValueChange={setSelectedCategory} value={selectedCategory || ''}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategory && (
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Select Services
                    </Label>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center space-x-2"
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
                            className={`text-sm font-normal cursor-pointer ${
                              !service.isAvailable ? 'text-gray-400' : ''
                            }`}
                          >
                            {service.name}
                            {!service.isAvailable && ' (Unavailable)'}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.services.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Selected Services
                    </Label>
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-100 rounded-lg">
                      {formData.services.map((serviceId: string) => {
                        const service = services.find(s => s.id === serviceId);
                        if (!service) return null;
                        return (
                          <Badge
                            key={service.id}
                            variant="secondary"
                            className="flex items-center gap-2"
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
                              className="rounded-full hover:bg-gray-300 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateSelect}
                        initialFocus
                        disabled={[
                          { before: new Date(Date.now() + 86400000) },
                          { dayOfWeek: [0] },
                          ...fullyBookedDates,
                        ]}
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
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {date && availableSlotsForSelectedDate.length > 0 ? (
                        availableSlotsForSelectedDate.map((slot: any) => {
                          const isBooked =
                            bookedSlots[formData.date]?.includes(slot);
                          return (
                            <SelectItem
                              key={slot}
                              value={slot}
                              disabled={isBooked}
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

                <div className="pt-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Inspiration Photo (Optional)
                  </Label>
                  <FileUpload onChange={handleFileChange} />
                </div>

                <Textarea
                  name="notes"
                  placeholder="Additional Notes (Optional)"
                  value={formData.notes}
                  onChange={handleChange}
                  className="bg-white"
                />
                <Button
                  type="submit"
                  className="w-full bg-black text-white hover:bg-gray-900 py-3 text-base"
                  disabled={
                    isSubmitting ||
                    !formData.date ||
                    formData.services.length === 0 ||
                    !formData.timeSlot
                  }
                >
                  {isSubmitting ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4 text-gray-800 p-4 border rounded-lg bg-white">
                  <h3 className="font-semibold text-lg text-center border-b pb-2 mb-4">
                    Booking Summary
                  </h3>
                  <div className="flex justify-between">
                    <span>Name:</span> <strong>{formData.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span> <strong>{formData.date}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Slot:</span>{" "}
                    <strong>{formatTime(formData.timeSlot)}</strong>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Services:</span>
                      <div className="text-right font-semibold">
                        {formData.services.map((s: any) => (
                          <div key={s}>
                            {services.find((service) => service.id === s)?.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-2">
                  <Checkbox
                    id="terms"
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(Boolean(checked))
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I have read and agree to the <StudioPolicies />.
                  </label>
                </div>
                <Button
                  onClick={handlePayment}
                  disabled={isPaying || !agreedToTerms}
                  className="w-full bg-black text-white py-3 text-base"
                >
                  {isPaying ? "Processing..." : "Pay K10,000 Booking Fee"}
                </Button>
                <Button
                  variant="link"
                  onClick={() => setStep("form")}
                  className="w-full text-gray-600 hover:text-black"
                >
                  Go Back & Edit
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
} 