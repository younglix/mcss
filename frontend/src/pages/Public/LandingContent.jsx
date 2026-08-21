import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../../components/public/PublicHeader.jsx';
import PublicFooter from '../../components/public/PublicFooter.jsx';
import { hero, admissionsBanner, about, academics, fees, gallery } from './landingData.js';

const toneClasses = {
  primary: { icon: 'bg-primary-container text-on-primary-container', link: 'group-hover:bg-primary' },
  secondary: { icon: 'bg-secondary text-on-secondary', link: 'group-hover:bg-primary' },
};

export default function LandingContent() {
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('mcssLandingBannerHidden') === 'true') setBannerVisible(false);
  }, []);

  const dismissBanner = () => {
    setBannerVisible(false);
    sessionStorage.setItem('mcssLandingBannerHidden', 'true');
  };

  return (
    <div className="bg-surface-container-lowest">
      {bannerVisible && (
        <div className="bg-tertiary-container text-on-tertiary-container py-2.5 px-gutter flex items-center justify-between gap-md">
          <div className="flex items-center gap-sm min-w-0 max-w-container-max mx-auto w-full justify-between">
            <div className="flex items-center gap-sm min-w-0">
              <span className="material-symbols-outlined text-body-md shrink-0">campaign</span>
              <p className="text-xs font-bold tracking-wider uppercase truncate">{admissionsBanner.text}</p>
            </div>
            <div className="flex items-center gap-md shrink-0">
              <Link to="/apply" className="text-xs font-bold border-b border-current whitespace-nowrap">
                {admissionsBanner.cta}
              </Link>
              <button onClick={dismissBanner} aria-label="Dismiss" className="opacity-70 hover:opacity-100">
                <span className="material-symbols-outlined text-body-md">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PublicHeader />

      <section className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-surface-container-low -z-0 hidden lg:block" />
        <div className="max-w-container-max mx-auto px-gutter py-xl lg:py-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-sm mb-sm">
              <div className="h-px w-8 bg-tertiary-container lg:hidden" />
              <span className="text-tertiary font-label-md text-label-xs lg:text-xs tracking-[0.3em] font-bold uppercase">{hero.eyebrow}</span>
            </div>
            <h2 className="font-headline-xl text-headline-lg lg:text-headline-xl text-primary leading-[1.1] mb-md">
              {hero.title} <br />
              <span className="italic text-secondary">{hero.titleAccent}</span>
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl mb-lg">{hero.body}</p>
            <div className="flex flex-col sm:flex-row gap-md">
              <Link
                to="/apply"
                className="bg-primary text-on-primary py-md px-xl font-label-md font-bold tracking-widest uppercase rounded-sm shadow-xl flex items-center justify-center gap-sm hover:opacity-90 transition-opacity"
              >
                Start Your Journey
                <span className="material-symbols-outlined text-body-md">arrow_forward</span>
              </Link>
              <button className="border-2 border-secondary text-secondary py-md px-xl font-label-md font-bold tracking-widest uppercase rounded-sm hover:bg-secondary/5 transition-colors">
                Virtual Tour
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative mt-xl lg:mt-0">
            <div className="relative w-full aspect-[4/5] lg:aspect-square">
              <div className="absolute inset-0 border-8 lg:border-[12px] border-surface-container-lowest shadow-2xl overflow-hidden rounded-lg lg:rounded-none z-10">
                <img src={hero.imageUrl} alt="Mount Carmel campus" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-6 -right-2 lg:right-0 lg:translate-x-1/4 z-20 bg-secondary p-lg shadow-xl text-on-secondary max-w-40">
                <p className="text-3xl font-headline-lg font-bold">{hero.stat.value}</p>
                <p className="text-label-xs uppercase tracking-widest leading-tight mt-1 opacity-80">{hero.stat.label}</p>
              </div>
              <div className="absolute -top-10 -left-10 w-40 h-40 border-[20px] border-tertiary-container/10 rounded-full z-0 hidden lg:block" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl lg:py-20 bg-surface-container-lowest" id="about">
        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
          <div className="grid grid-cols-2 gap-md order-2 lg:order-1">
            <div className="space-y-md lg:pt-12">
              <div className="aspect-[3/4] rounded-lg overflow-hidden border-t-8 border-primary">
                <img src={about.images[0]} alt="Students at Mount Carmel" className="w-full h-full object-cover" />
              </div>
              <div className="aspect-square bg-secondary/10 flex items-center justify-center p-lg rounded-lg">
                <span className="material-symbols-outlined text-5xl text-secondary">history_edu</span>
              </div>
            </div>
            <div className="space-y-md">
              <div className="aspect-square bg-primary flex flex-col justify-center p-lg text-on-primary rounded-lg">
                <span className="material-symbols-outlined mb-sm text-3xl">flare</span>
                <p className="font-headline-md text-lg italic">Our Vision</p>
                <p className="text-xs opacity-80 leading-relaxed mt-xs">Beacon of integral education in Africa.</p>
              </div>
              <div className="aspect-3/4 rounded-lg overflow-hidden border-b-8 border-tertiary-container">
                <img src={about.images[1]} alt="Mount Carmel architecture" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="text-tertiary font-label-md text-xs tracking-[0.2em] font-bold uppercase mb-sm block">{about.eyebrow}</span>
            <h3 className="font-headline-lg text-headline-md lg:text-headline-lg text-primary leading-tight mb-md">
              {about.title} <br />
              <span className="italic">{about.titleAccent}</span>
            </h3>
            <p className="font-body-md text-on-surface-variant leading-relaxed mb-lg">{about.body}</p>
            <div className="space-y-md">
              {about.points.map((point) => (
                <div key={point.title} className="flex gap-md p-md rounded-lg bg-surface-container-low border border-outline/10">
                  <div className="w-10 h-10 shrink-0 bg-primary text-on-primary rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-body-md">{point.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-label-md font-bold text-primary text-sm">{point.title}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{point.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl lg:py-20 bg-surface-container-low" id="academics">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-xl">
            <span className="text-tertiary font-label-md text-xs tracking-[0.2em] font-bold uppercase mb-sm block">{academics.eyebrow}</span>
            <h3 className="font-headline-lg text-headline-md lg:text-headline-lg text-primary leading-tight">{academics.title}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {academics.programs.map((program) => (
              <div key={program.name} className="bg-surface-container-lowest p-xl rounded-lg border border-outline/10 hover:border-primary transition-all group shadow-sm">
                <div className="flex justify-between items-start mb-lg">
                  <div className={`w-14 h-14 rounded flex items-center justify-center ${toneClasses[program.tone].icon}`}>
                    <span className="material-symbols-outlined text-2xl">{program.icon}</span>
                  </div>
                  <span className="text-label-xs font-bold text-outline uppercase tracking-widest">{program.grades}</span>
                </div>
                <h4 className="font-headline-md text-headline-sm text-primary mb-sm italic">{program.name}</h4>
                <p className="font-body-md text-on-surface-variant leading-relaxed mb-lg">{program.body}</p>
                <div className="flex items-center justify-between pt-md border-t border-outline/10">
                  <span className="text-xs font-bold uppercase text-secondary">{program.tag}</span>
                  <span
                    className={`w-9 h-9 border border-primary rounded flex items-center justify-center text-primary transition-all ${toneClasses[program.tone].link} group-hover:text-on-primary`}
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-xl lg:py-20 bg-nav text-on-nav relative overflow-hidden">
        <span className="material-symbols-outlined absolute top-10 right-10 text-on-nav/10 text-6xl hidden md:block">flare</span>
        <div className="max-w-container-max mx-auto px-gutter grid grid-cols-1 lg:grid-cols-12 gap-xl relative z-10">
          <div className="lg:col-span-4">
            <h3 className="font-headline-lg text-headline-md lg:text-headline-lg leading-tight mb-md">
              {fees.title} <br />
              <span className="italic text-tertiary-fixed">{fees.titleAccent}</span>
            </h3>
            <p className="opacity-80 font-body-md mb-lg leading-relaxed">{fees.body}</p>
            <div className="flex flex-col gap-md">
              {fees.perks.map((perk) => (
                <div key={perk.label} className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-tertiary-fixed">{perk.icon}</span>
                  <span className="font-label-md">{perk.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="bg-on-nav/5 border border-on-nav/10 p-lg lg:p-xl rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-center">
                {fees.rows.map((row) => (
                  <div key={row.label} className="text-center md:text-left">
                    <h4 className="font-label-sm uppercase tracking-widest opacity-60 mb-xs">{row.label}</h4>
                    <p className="font-headline-md text-headline-sm">{row.value}</p>
                    <p className="font-label-sm opacity-60">{row.note}</p>
                  </div>
                ))}
                <div className="flex items-center justify-center md:justify-end">
                  <button className="bg-tertiary-container text-on-tertiary-container px-xl py-md font-label-md font-bold rounded-sm hover:opacity-90 transition-opacity">
                    View Full Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-xl lg:py-20 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-xl gap-md">
            <div>
              <h3 className="font-headline-lg text-headline-md lg:text-headline-lg text-primary">{gallery.title}</h3>
              <p className="text-on-surface-variant mt-sm italic max-w-md">{gallery.body}</p>
            </div>
            <button className="font-label-md font-bold border-b-2 border-primary pb-1 text-primary flex items-center gap-sm whitespace-nowrap">
              Browse All Albums <span className="material-symbols-outlined text-body-md">trending_flat</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div className="md:row-span-2 aspect-video md:aspect-square rounded-lg overflow-hidden shadow-lg group relative">
              <img src={gallery.images[0].url} alt={gallery.images[0].label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="font-headline-md text-on-primary">{gallery.images[0].label}</p>
              </div>
            </div>
            {gallery.images.slice(1).map((image) => (
              <div key={image.label} className="aspect-square rounded-lg overflow-hidden shadow-lg group relative">
                <img src={image.url} alt={image.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="font-headline-md text-on-primary">{image.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />

      <Link
        to="/apply"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-tertiary-container text-on-tertiary-container rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform lg:hidden"
        aria-label="Apply now"
      >
        <span className="material-symbols-outlined text-3xl">mail</span>
      </Link>
    </div>
  );
}
