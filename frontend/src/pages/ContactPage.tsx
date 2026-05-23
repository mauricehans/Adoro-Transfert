import { useState } from 'react';
import { MessageCircle, Mail, Phone, MapPin, Send } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useContactSettings } from '../hooks/useContactSettings';
import { usePublicSettings } from '../hooks/usePublicSettings';

export default function ContactPage() {
  const { whatsappNumber, notificationEmail } = useContactSettings();
  const { address, hours } = usePublicSettings();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Bonjour, je suis ${name} (${email}).\n\nSujet: ${subject}\n\n${message}`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="font-display text-5xl text-bone mb-4">CONTACTEZ-NOUS</h1>
          <p className="text-ash text-lg max-w-2xl mx-auto">
            Une question ? Besoin d'aide ? Contactez notre equipe via WhatsApp ou remplissez le formulaire.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="animate-fade-up">
            <div className="glass-card p-6 md:p-8">
              <h2 className="font-display text-2xl text-bone mb-6">ENVOYER UN MESSAGE</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nom complet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                />
                <Input
                  label="Sujet"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Sujet de votre message"
                  required
                />
                <div>
                  <label className="block text-sm font-mono text-ash mb-1.5 uppercase tracking-wider">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Votre message..."
                    rows={5}
                    required
                    className="w-full bg-dark-800 border border-dark-500 rounded-xl px-4 py-2.5 text-bone placeholder:text-ash/50 focus:outline-none focus:border-emerald-primary/50 focus:ring-1 focus:ring-emerald-primary/30 transition-colors resize-none"
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  <Send size={18} className="mr-2" />
                  Envoyer via WhatsApp
                </Button>
                <p className="text-xs text-ash/60 text-center">
                  Le formulaire vous redirige vers WhatsApp avec votre message pre-rempli.
                </p>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="animate-fade-up animate-delay-200">
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-display text-xl text-bone mb-4">INFORMATIONS</h3>
                <div className="space-y-4">
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center group-hover:bg-emerald-primary/20 transition-colors">
                      <MessageCircle size={20} className="text-emerald-primary" />
                    </div>
                    <div>
                      <p className="text-bone text-sm font-medium">WhatsApp</p>
                      <p className="text-ash text-xs">
                        {whatsappNumber.length === 10
                          ? whatsappNumber.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1.$2.$3.$4.$5')
                          : whatsappNumber.length === 11 && whatsappNumber.startsWith('33')
                          ? whatsappNumber.replace(/33(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '0$1.$2.$3.$4.$5')
                          : whatsappNumber}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${notificationEmail}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center group-hover:bg-emerald-primary/20 transition-colors">
                      <Mail size={20} className="text-emerald-primary" />
                    </div>
                    <div>
                      <p className="text-bone text-sm font-medium">Email</p>
                      <p className="text-ash text-xs">{notificationEmail}</p>
                    </div>
                  </a>

                  <a
                    href={`tel:${whatsappNumber}`}
                    className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-700/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center group-hover:bg-emerald-primary/20 transition-colors">
                      <Phone size={20} className="text-emerald-primary" />
                    </div>
                    <div>
                      <p className="text-bone text-sm font-medium">Telephone</p>
                      <p className="text-ash text-xs">
                        {whatsappNumber.length === 10
                          ? whatsappNumber.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1.$2.$3.$4.$5')
                          : whatsappNumber.length === 11 && whatsappNumber.startsWith('33')
                          ? whatsappNumber.replace(/33(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '0$1.$2.$3.$4.$5')
                          : whatsappNumber}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-dark-800/50">
                    <div className="w-10 h-10 rounded-lg bg-emerald-primary/10 flex items-center justify-center">
                      <MapPin size={20} className="text-emerald-primary" />
                    </div>
                    <div>
                      <p className="text-bone text-sm font-medium">Adresse</p>
                      <p className="text-ash text-xs">
                        {address.full || `${address.city}, ${address.country}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="glass-card p-6">
                <h3 className="font-display text-xl text-bone mb-4">HORAIRES</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ash">Lundi - Vendredi</span>
                    <span className="text-bone font-mono">{hours.weekdays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ash">Samedi</span>
                    <span className="text-bone font-mono">{hours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ash">Dimanche</span>
                    <span className="text-bone font-mono">{hours.sunday}</span>
                  </div>
                </div>
                {hours.timezone && (
                  <p className="mt-4 text-xs text-ash/60">{hours.timezone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
