"use client";

import { useTranslations } from "next-intl";
import { EMPTY_LOCATION, type StepProps } from "./types";

const inputClass =
  "w-full px-4 py-3 text-sm bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-zinc-400 text-zinc-800";
const labelClass = "text-sm font-semibold text-zinc-700";

export default function Step5Contact({ state, update }: StepProps) {
  const t = useTranslations("Organizer");

  function updateLocation(index: number, patch: Partial<(typeof state.locations)[number]>) {
    update({
      locations: state.locations.map((loc, i) => (i === index ? { ...loc, ...patch } : loc)),
    });
  }

  function addLocation() {
    update({ locations: [...state.locations, { ...EMPTY_LOCATION }] });
  }

  function removeLocation(index: number) {
    update({ locations: state.locations.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <p className="text-xs font-bold tracking-wide uppercase text-[#e21d12] mb-2">
        {t("wizardStepLabel", { current: 5, total: 10 })}
      </p>
      <h2 className="text-2xl font-extrabold text-zinc-900 mb-2" style={{ fontFamily: "var(--font-playfair)" }}>
        {t("wizardContactTitle")}
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-md">{t("wizardContactSubtitle")}</p>

      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>{t("wizardPublicEmailLabel")} *</label>
          <input
            type="email"
            value={state.publicEmail}
            onChange={(e) => update({ publicEmail: e.target.value })}
            placeholder={t("wizardPublicEmailPlaceholder")}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardPhoneLabel")}</label>
            <input
              type="tel"
              value={state.phone}
              onChange={(e) => update({ phone: e.target.value })}
              placeholder={t("wizardPhonePlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardWebsiteLabel")}</label>
            <input
              type="url"
              value={state.website}
              onChange={(e) => update({ website: e.target.value })}
              placeholder={t("wizardWebsitePlaceholder")}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardInstagramLabel")}</label>
            <input type="text" value={state.instagram} onChange={(e) => update({ instagram: e.target.value })} placeholder="@handle" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardTwitterLabel")}</label>
            <input type="text" value={state.twitter} onChange={(e) => update({ twitter: e.target.value })} placeholder="@handle" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardFacebookLabel")}</label>
            <input type="text" value={state.facebook} onChange={(e) => update({ facebook: e.target.value })} placeholder="@handle" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardYoutubeLabel")}</label>
            <input type="text" value={state.youtube} onChange={(e) => update({ youtube: e.target.value })} placeholder="@handle" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>{t("wizardTiktokLabel")}</label>
            <input type="text" value={state.tiktok} onChange={(e) => update({ tiktok: e.target.value })} placeholder="@handle" className={inputClass} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className={labelClass}>{t("wizardLocationsLabel")} *</label>
            <button type="button" onClick={addLocation} className="text-sm font-semibold text-[#e21d12] hover:text-red-700">
              + {t("wizardAddLocation")}
            </button>
          </div>

          {state.locations.length === 0 && (
            <p className="text-xs text-zinc-400">{t("wizardNoLocations")}</p>
          )}

          {state.locations.map((loc, index) => (
            <div key={index} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500">{t("wizardLocationN", { n: index + 1 })}</span>
                <button type="button" onClick={() => removeLocation(index)} className="text-xs font-semibold text-red-500 hover:text-red-600">
                  {t("wizardRemoveLocation")}
                </button>
              </div>
              <input
                type="text"
                value={loc.name}
                onChange={(e) => updateLocation(index, { name: e.target.value })}
                placeholder={t("wizardLocationNameLabel")}
                className={`${inputClass} bg-white`}
              />
              <input
                type="text"
                value={loc.streetAddress}
                onChange={(e) => updateLocation(index, { streetAddress: e.target.value })}
                placeholder={t("wizardStreetAddressLabel")}
                className={`${inputClass} bg-white`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={loc.city}
                  onChange={(e) => updateLocation(index, { city: e.target.value })}
                  placeholder={t("wizardCityLabel")}
                  className={`${inputClass} bg-white`}
                />
                <input
                  type="text"
                  value={loc.postalCode}
                  onChange={(e) => updateLocation(index, { postalCode: e.target.value })}
                  placeholder={t("wizardPostalCodeLabel")}
                  className={`${inputClass} bg-white`}
                />
                <input
                  type="text"
                  value={loc.province}
                  onChange={(e) => updateLocation(index, { province: e.target.value })}
                  placeholder={t("wizardProvinceLabel")}
                  className={`${inputClass} bg-white`}
                />
                <input
                  type="text"
                  value={loc.country}
                  onChange={(e) => updateLocation(index, { country: e.target.value })}
                  placeholder={t("wizardCountryLabel")}
                  className={`${inputClass} bg-white`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
