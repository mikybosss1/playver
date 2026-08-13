import { LegalContent, LEGAL_UPDATED, LEGAL_UPDATED_FR, p, list } from "./types";

const acceptableUse: LegalContent = {
  en: {
    title: "Acceptable Use Policy",
    updated: LEGAL_UPDATED,
    intro: [
      p(
        "This Acceptable Use Policy sets out rules for using Playver. It forms part of our Terms of Service, and violating it may result in content removal, suspension, or termination of your account."
      ),
    ],
    sections: [
      {
        id: "prohibited",
        heading: "1. Prohibited conduct",
        blocks: [
          p("When using the Service, you agree not to:"),
          list([
            "Provide false or misleading information about yourself, an event, or an organization, including misrepresenting your age or authority to register a minor;",
            "Create a fraudulent event listing, collect payment for an event you do not intend to hold, or otherwise use the wallet or payment features for fraud or money laundering;",
            "Harass, threaten, bully, or discriminate against another user, or post content that is defamatory, obscene, hateful, or otherwise unlawful;",
            "Collect personal information about other users beyond what is needed for a legitimate event-related purpose, or use it for anything other than that purpose;",
            "Upload content you do not have the right to share, including content that infringes someone else's intellectual property or privacy rights;",
            "Attempt to gain unauthorized access to another user's account or to any part of the Service, or interfere with the security or normal operation of the Service (including through malware, scraping that overburdens our systems, or circumventing access controls);",
            "Use the Service to violate any applicable law or regulation, including laws relating to child safety, gambling, or unfair or deceptive business practices;",
            "Use automated means to create accounts or register for events at scale without our permission, or resell registrations for a profit without the Organizer's consent.",
          ]),
        ],
      },
      {
        id: "organizer-conduct",
        heading: "2. Additional rules for Organizers",
        blocks: [
          p("Organizers must not:"),
          list([
            "List an event they do not have the right or intention to hold;",
            "Misrepresent pricing, refund terms, eligibility requirements, or safety arrangements for an event;",
            "Use participant contact information collected through Playver for purposes unrelated to the event without the participant's consent;",
            "Cancel or misrepresent event outcomes in order to avoid issuing refunds owed under our Refund & Cancellation Policy.",
          ]),
        ],
      },
      {
        id: "reporting",
        heading: "3. Reporting a violation",
        blocks: [
          p(
            "If you believe a user, Organizer, or listing violates this Policy, contact us at playver@gmail.com with as much detail as possible. We review reports and take action we consider appropriate, which may include removing content, suspending accounts, or reporting conduct to law enforcement where warranted."
          ),
        ],
      },
      {
        id: "enforcement",
        heading: "4. Enforcement",
        blocks: [
          p(
            "We may remove content, restrict features, or suspend or terminate accounts that violate this Policy, with notice where reasonably possible. Violating this Policy may also constitute a breach of our Terms of Service."
          ),
        ],
      },
      {
        id: "contact",
        heading: "5. Contact us",
        blocks: [p("Questions about this Acceptable Use Policy can be sent to playver@gmail.com.")],
      },
    ],
  },
  fr: {
    title: "Politique d'utilisation acceptable",
    updated: LEGAL_UPDATED_FR,
    intro: [
      p(
        "La présente Politique d'utilisation acceptable établit les règles d'utilisation de Playver. Elle fait partie de nos Conditions d'utilisation, et sa violation peut entraîner le retrait de contenu, la suspension ou la résiliation de votre compte."
      ),
    ],
    sections: [
      {
        id: "prohibited",
        heading: "1. Conduites interdites",
        blocks: [
          p("Lorsque vous utilisez le Service, vous acceptez de ne pas :"),
          list([
            "Fournir des renseignements faux ou trompeurs à votre sujet, au sujet d'un événement ou d'une organisation, y compris fausser votre âge ou votre pouvoir d'inscrire un mineur;",
            "Créer une annonce d'événement frauduleuse, percevoir un paiement pour un événement que vous n'avez pas l'intention de tenir, ou autrement utiliser le portefeuille ou les fonctionnalités de paiement à des fins de fraude ou de blanchiment d'argent;",
            "Harceler, menacer, intimider ou faire preuve de discrimination envers un autre utilisateur, ou publier du contenu diffamatoire, obscène, haineux ou autrement illégal;",
            "Recueillir des renseignements personnels sur d'autres utilisateurs au-delà de ce qui est nécessaire à une fin légitime liée à un événement, ou les utiliser à toute autre fin;",
            "Téléverser du contenu sur lequel vous n'avez pas les droits nécessaires, y compris du contenu portant atteinte à la propriété intellectuelle ou à la vie privée d'autrui;",
            "Tenter d'accéder sans autorisation au compte d'un autre utilisateur ou à toute partie du Service, ou nuire à la sécurité ou au fonctionnement normal du Service (notamment au moyen de logiciels malveillants, d'extraction de données surchargeant nos systèmes, ou en contournant les contrôles d'accès);",
            "Utiliser le Service en violation d'une loi ou d'un règlement applicable, y compris les lois relatives à la sécurité des enfants, aux jeux d'argent ou aux pratiques commerciales déloyales ou trompeuses;",
            "Utiliser des moyens automatisés pour créer des comptes ou s'inscrire à des événements à grande échelle sans notre autorisation, ou revendre des inscriptions à profit sans le consentement de l'Organisateur.",
          ]),
        ],
      },
      {
        id: "organizer-conduct",
        heading: "2. Règles additionnelles pour les Organisateurs",
        blocks: [
          p("Les Organisateurs ne doivent pas :"),
          list([
            "Afficher un événement qu'ils n'ont pas le droit ou l'intention de tenir;",
            "Fausser les prix, les conditions de remboursement, les critères d'admissibilité ou les mesures de sécurité d'un événement;",
            "Utiliser les coordonnées des participants recueillies par Playver à des fins non liées à l'événement sans le consentement du participant;",
            "Annuler un événement ou en dénaturer l'issue afin d'éviter d'émettre des remboursements dus en vertu de notre Politique de remboursement et d'annulation.",
          ]),
        ],
      },
      {
        id: "reporting",
        heading: "3. Signaler une violation",
        blocks: [
          p(
            "Si vous croyez qu'un utilisateur, un Organisateur ou une annonce contrevient à la présente Politique, communiquez avec nous à playver@gmail.com en fournissant le plus de détails possible. Nous examinons les signalements et prenons les mesures que nous jugeons appropriées, pouvant inclure le retrait de contenu, la suspension de comptes ou le signalement aux autorités compétentes lorsque justifié."
          ),
        ],
      },
      {
        id: "enforcement",
        heading: "4. Application",
        blocks: [
          p(
            "Nous pouvons retirer du contenu, restreindre des fonctionnalités, ou suspendre ou résilier des comptes qui contreviennent à la présente Politique, avec préavis lorsque raisonnablement possible. Une violation de la présente Politique peut également constituer une violation de nos Conditions d'utilisation."
          ),
        ],
      },
      {
        id: "contact",
        heading: "5. Nous joindre",
        blocks: [p("Toute question au sujet de la présente Politique d'utilisation acceptable peut être envoyée à playver@gmail.com.")],
      },
    ],
  },
};

export default acceptableUse;
