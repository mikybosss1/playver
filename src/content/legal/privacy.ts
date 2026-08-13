import { LegalContent, LEGAL_UPDATED, LEGAL_UPDATED_FR, p, list } from "./types";

const privacy: LegalContent = {
  en: {
    title: "Privacy Policy",
    updated: LEGAL_UPDATED,
    intro: [
      p(
        "Playver Inc. (\"Playver\", \"we\", \"us\") respects your privacy. This Privacy Policy explains what personal information we collect through Playver (the \"Service\"), why we collect it, how we use and share it, and the choices and rights you have. It is written to comply with Quebec's Act respecting the protection of personal information in the private sector (including the changes made by Law 25) and the federal Personal Information Protection and Electronic Documents Act (PIPEDA)."
      ),
      p(
        "By using the Service, you acknowledge this Privacy Policy. If you do not agree with it, please do not use the Service."
      ),
    ],
    sections: [
      {
        id: "privacy-officer",
        heading: "1. Who is responsible for your information",
        blocks: [
          p(
            "Playver Inc. is responsible for the personal information it collects. We have designated a person in charge of the protection of personal information (our \"Privacy Officer\"), reachable at playver@gmail.com, who oversees our compliance with this Policy and applicable privacy law and handles any questions or complaints."
          ),
        ],
      },
      {
        id: "information-we-collect",
        heading: "2. Information we collect",
        blocks: [
          p("We collect the following categories of information:"),
          list([
            "Account information: your name, email address, password (stored securely and hashed), and optional profile photo.",
            "Profile and participation information: athlete profile details, team memberships, event and tournament registrations, and any responses you submit to registration forms created by Organizers (which may include fields the Organizer chooses, such as emergency contacts or medical notes — see Section 5).",
            "Payment and wallet information: wallet top-up and payment amounts, transaction history, and withdrawal records. Full card numbers are never stored by Playver — card payments are handled directly by our payment processor, Stripe.",
            "Communications: messages sent through the Service between organizers and participants, support requests, and feature requests you submit to us.",
            "Technical and usage information: IP address, browser and device type, log-in sessions, and pages or features used, collected automatically when you use the Service.",
            "Cookies and similar technologies: see our Cookie Policy for details.",
          ]),
        ],
      },
      {
        id: "how-we-use",
        heading: "3. How we use your information",
        blocks: [
          p("We use personal information to:"),
          list([
            "Create and manage your account and provide the features of the Service (profiles, teams, events, tournaments, messaging);",
            "Process wallet top-ups, event and tournament payments, and organizer withdrawals;",
            "Communicate with you about your account, registrations, event updates, cancellations, and refunds;",
            "Maintain the security and integrity of the Service, prevent fraud, and enforce our Terms of Service and Acceptable Use Policy;",
            "Improve and develop the Service, including understanding how features are used;",
            "Comply with legal, accounting, and regulatory obligations; and",
            "With your consent, send you optional communications such as product updates.",
          ]),
          p(
            "We only collect the personal information reasonably necessary for these purposes, and we rely on your consent where required, which you may withdraw at any time, subject to legal or contractual restrictions and reasonable notice, by contacting playver@gmail.com."
          ),
        ],
      },
      {
        id: "sharing",
        heading: "4. How we share your information",
        blocks: [
          p("We share personal information only as follows:"),
          list([
            "With Organizers: when you register for an event, team, or tournament, the relevant Organizer receives the registration information needed to run that event, including any custom form responses you submit to them.",
            "With service providers who process data on our behalf under contract, currently including Stripe, Inc. (payment processing and organizer payouts), Resend (transactional email delivery), and Neon (database hosting). These providers are only permitted to use your information to provide services to us.",
            "For legal reasons: where required by law, legal process, or to protect the rights, safety, or property of Playver, our users, or the public.",
            "In a business transfer: if Playver is involved in a merger, acquisition, or sale of assets, personal information may be transferred as part of that transaction, subject to this Policy.",
          ]),
          p("We do not sell your personal information."),
        ],
      },
      {
        id: "cross-border",
        heading: "5. Custom registration forms and sensitive information",
        blocks: [
          p(
            "Organizers can create custom registration forms for their events. Fields on those forms (for example, emergency contact details) are chosen by the Organizer, not Playver, and the Organizer is responsible for only requesting information that is necessary and appropriate, and for how they use it. If you are asked for information you consider sensitive or unnecessary, we encourage you to contact the Organizer directly, or Playver at playver@gmail.com if you have concerns."
          ),
        ],
      },
      {
        id: "cross-border-transfer",
        heading: "6. Cross-border data transfers",
        blocks: [
          p(
            "Some of our service providers, including Stripe and our hosting infrastructure, may process personal information outside Quebec, including in the United States. Before using a service provider that processes personal information outside Quebec, we assess the privacy protection applicable to that information, including whether it provides protection equivalent to Quebec law. Your information may be subject to the laws of the country in which it is processed, including lawful access requests by that country's authorities."
          ),
        ],
      },
      {
        id: "retention",
        heading: "7. How long we keep your information",
        blocks: [
          p(
            "We keep personal information for as long as your account is active and as needed to provide the Service. After you close your account, we retain information only as long as necessary for legitimate business, accounting, tax, or legal purposes (for example, financial and payment records are generally kept for the period required by Canadian tax law), after which it is deleted or anonymized."
          ),
        ],
      },
      {
        id: "security",
        heading: "8. How we protect your information",
        blocks: [
          p(
            "We use reasonable administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, use, disclosure, alteration, or destruction, including encryption of passwords and secure connections. No system is completely secure, and we cannot guarantee absolute security."
          ),
          p(
            "If a confidentiality incident involving your personal information creates a risk of serious injury, we will notify the Commission d'accès à l'information du Québec and affected individuals as required by law, and take reasonable steps to reduce the risk of harm."
          ),
        ],
      },
      {
        id: "your-rights",
        heading: "9. Your privacy rights",
        blocks: [
          p("Subject to applicable law, you have the right to:"),
          list([
            "Access the personal information we hold about you;",
            "Correct (rectify) inaccurate or incomplete information;",
            "Withdraw your consent to certain processing, subject to legal or contractual restrictions;",
            "Request that we cease disseminating your personal information or de-index a link to it, where the dissemination causes you serious injury and that injury is clearly greater than the public's interest in the information or the exercise of freedom of expression;",
            "Receive certain personal information you have provided to us in a structured, commonly used technical format, or have it transferred to another person or organization, where technically feasible;",
            "File a complaint with our Privacy Officer, and, if unresolved, with the Commission d'accès à l'information du Québec.",
          ]),
          p(
            "To exercise any of these rights, contact our Privacy Officer at playver@gmail.com. We will respond within the time required by law (currently 30 days). We may need to verify your identity before acting on a request."
          ),
        ],
      },
      {
        id: "children",
        heading: "10. Children's and minors' privacy",
        blocks: [
          p(
            "The Service is not directed at children for the purpose of independently creating an account, and we do not knowingly collect personal information directly from children under 13 without appropriate consent. Many event participants are minors registered by a parent, guardian, or coach; the adult registering the minor is responsible for providing any required parental or guardian consent and for the accuracy of the minor's information. If you believe a minor has provided us with personal information other than through such a registration, contact us at playver@gmail.com and we will take appropriate action."
          ),
        ],
      },
      {
        id: "cookies",
        heading: "11. Cookies",
        blocks: [
          p(
            "We use cookies and similar technologies to operate and improve the Service. See our Cookie Policy for details on the types of cookies we use and how to manage your preferences."
          ),
        ],
      },
      {
        id: "changes",
        heading: "12. Changes to this Policy",
        blocks: [
          p(
            "We may update this Privacy Policy from time to time. If we make material changes, we will provide reasonable notice, such as by email or an in-app notice, before the changes take effect."
          ),
        ],
      },
      {
        id: "contact",
        heading: "13. Contact us",
        blocks: [
          p(
            "Questions, requests, or complaints about this Privacy Policy or your personal information can be sent to our Privacy Officer at playver@gmail.com."
          ),
        ],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: LEGAL_UPDATED_FR,
    intro: [
      p(
        "Playver Inc. (« Playver », « nous ») respecte votre vie privée. La présente Politique de confidentialité explique quels renseignements personnels nous recueillons par l'entremise de Playver (le « Service »), pourquoi nous les recueillons, comment nous les utilisons et les communiquons, ainsi que les choix et droits dont vous disposez. Elle est rédigée conformément à la Loi sur la protection des renseignements personnels dans le secteur privé du Québec (incluant les modifications apportées par la Loi 25) et à la Loi fédérale sur la protection des renseignements personnels et les documents électroniques (LPRPDE)."
      ),
      p(
        "En utilisant le Service, vous prenez acte de la présente Politique de confidentialité. Si vous n'êtes pas d'accord avec celle-ci, veuillez ne pas utiliser le Service."
      ),
    ],
    sections: [
      {
        id: "privacy-officer",
        heading: "1. Qui est responsable de vos renseignements",
        blocks: [
          p(
            "Playver Inc. est responsable des renseignements personnels qu'elle recueille. Nous avons désigné une personne responsable de la protection des renseignements personnels (notre « responsable de la protection des renseignements personnels »), joignable à playver@gmail.com, qui veille au respect de la présente Politique et des lois applicables en matière de vie privée et traite les questions ou plaintes."
          ),
        ],
      },
      {
        id: "information-we-collect",
        heading: "2. Renseignements que nous recueillons",
        blocks: [
          p("Nous recueillons les catégories de renseignements suivantes :"),
          list([
            "Renseignements de compte : votre nom, adresse courriel, mot de passe (conservé de façon sécurisée et haché) et photo de profil facultative.",
            "Renseignements de profil et de participation : détails du profil d'athlète, appartenance à des équipes, inscriptions à des événements et tournois, ainsi que toute réponse que vous soumettez à des formulaires d'inscription créés par les Organisateurs (qui peuvent inclure des champs choisis par l'Organisateur, comme des coordonnées d'urgence ou des notes médicales — voir la section 5).",
            "Renseignements de paiement et de portefeuille : montants de recharge et de paiement du portefeuille, historique des transactions et registres de retrait. Les numéros de carte complets ne sont jamais conservés par Playver — les paiements par carte sont traités directement par notre fournisseur de traitement des paiements, Stripe.",
            "Communications : messages échangés par l'entremise du Service entre organisateurs et participants, demandes de soutien et demandes de fonctionnalités que vous nous soumettez.",
            "Renseignements techniques et d'utilisation : adresse IP, type de navigateur et d'appareil, sessions de connexion, ainsi que pages ou fonctionnalités utilisées, recueillis automatiquement lorsque vous utilisez le Service.",
            "Témoins et technologies similaires : voir notre Politique relative aux témoins pour plus de détails.",
          ]),
        ],
      },
      {
        id: "how-we-use",
        heading: "3. Comment nous utilisons vos renseignements",
        blocks: [
          p("Nous utilisons les renseignements personnels pour :"),
          list([
            "Créer et gérer votre compte et offrir les fonctionnalités du Service (profils, équipes, événements, tournois, messagerie);",
            "Traiter les recharges de portefeuille, les paiements d'événements et de tournois, et les retraits des organisateurs;",
            "Communiquer avec vous au sujet de votre compte, de vos inscriptions, des mises à jour d'événements, des annulations et des remboursements;",
            "Assurer la sécurité et l'intégrité du Service, prévenir la fraude et faire respecter nos Conditions d'utilisation et notre Politique d'utilisation acceptable;",
            "Améliorer et développer le Service, notamment en comprenant comment les fonctionnalités sont utilisées;",
            "Nous conformer à nos obligations légales, comptables et réglementaires; et",
            "Avec votre consentement, vous envoyer des communications facultatives telles que des mises à jour sur nos produits.",
          ]),
          p(
            "Nous ne recueillons que les renseignements personnels raisonnablement nécessaires à ces fins, et nous nous appuyons sur votre consentement lorsque requis, lequel vous pouvez retirer en tout temps, sous réserve de restrictions légales ou contractuelles et d'un préavis raisonnable, en communiquant avec playver@gmail.com."
          ),
        ],
      },
      {
        id: "sharing",
        heading: "4. Comment nous communiquons vos renseignements",
        blocks: [
          p("Nous ne communiquons les renseignements personnels que dans les cas suivants :"),
          list([
            "Avec les Organisateurs : lorsque vous vous inscrivez à un événement, une équipe ou un tournoi, l'Organisateur concerné reçoit les renseignements d'inscription nécessaires à la tenue de cet événement, y compris toute réponse à un formulaire personnalisé que vous lui soumettez.",
            "Avec des fournisseurs de services qui traitent des données pour notre compte en vertu d'un contrat, actuellement Stripe, Inc. (traitement des paiements et versements aux organisateurs), Resend (livraison de courriels transactionnels) et Neon (hébergement de la base de données). Ces fournisseurs ne sont autorisés à utiliser vos renseignements que pour nous fournir des services.",
            "Pour des raisons légales : lorsque la loi ou une procédure judiciaire l'exige, ou pour protéger les droits, la sécurité ou les biens de Playver, de nos utilisateurs ou du public.",
            "Lors d'un transfert d'entreprise : si Playver participe à une fusion, une acquisition ou une vente d'actifs, les renseignements personnels pourraient être transférés dans le cadre de cette transaction, sous réserve de la présente Politique.",
          ]),
          p("Nous ne vendons pas vos renseignements personnels."),
        ],
      },
      {
        id: "cross-border",
        heading: "5. Formulaires d'inscription personnalisés et renseignements sensibles",
        blocks: [
          p(
            "Les Organisateurs peuvent créer des formulaires d'inscription personnalisés pour leurs événements. Les champs de ces formulaires (par exemple, les coordonnées d'urgence) sont choisis par l'Organisateur, et non par Playver, et l'Organisateur est responsable de ne demander que les renseignements nécessaires et appropriés, ainsi que de la façon dont il les utilise. Si l'on vous demande des renseignements que vous jugez sensibles ou non nécessaires, nous vous encourageons à communiquer directement avec l'Organisateur, ou avec Playver à playver@gmail.com si vous avez des préoccupations."
          ),
        ],
      },
      {
        id: "cross-border-transfer",
        heading: "6. Transferts de données hors Québec",
        blocks: [
          p(
            "Certains de nos fournisseurs de services, notamment Stripe et notre infrastructure d'hébergement, peuvent traiter des renseignements personnels hors Québec, y compris aux États-Unis. Avant de recourir à un fournisseur de services qui traite des renseignements personnels hors Québec, nous évaluons la protection de la vie privée applicable à ces renseignements, notamment si elle offre une protection équivalente à celle prévue par la loi québécoise. Vos renseignements peuvent être assujettis aux lois du pays où ils sont traités, y compris aux demandes d'accès licites des autorités de ce pays."
          ),
        ],
      },
      {
        id: "retention",
        heading: "7. Durée de conservation de vos renseignements",
        blocks: [
          p(
            "Nous conservons les renseignements personnels aussi longtemps que votre compte est actif et que cela est nécessaire pour fournir le Service. Après la fermeture de votre compte, nous ne conservons les renseignements que le temps nécessaire à des fins commerciales, comptables, fiscales ou juridiques légitimes (par exemple, les registres financiers et de paiement sont généralement conservés pendant la période exigée par les lois fiscales canadiennes), après quoi ils sont supprimés ou anonymisés."
          ),
        ],
      },
      {
        id: "security",
        heading: "8. Comment nous protégeons vos renseignements",
        blocks: [
          p(
            "Nous utilisons des mesures de sécurité administratives, techniques et physiques raisonnables conçues pour protéger les renseignements personnels contre l'accès, l'utilisation, la communication, la modification ou la destruction non autorisés, y compris le chiffrement des mots de passe et des connexions sécurisées. Aucun système n'est complètement sécurisé et nous ne pouvons garantir une sécurité absolue."
          ),
          p(
            "Si un incident de confidentialité touchant vos renseignements personnels présente un risque de préjudice sérieux, nous en aviserons la Commission d'accès à l'information du Québec et les personnes concernées, tel que la loi l'exige, et prendrons des mesures raisonnables pour réduire le risque de préjudice."
          ),
        ],
      },
      {
        id: "your-rights",
        heading: "9. Vos droits en matière de vie privée",
        blocks: [
          p("Sous réserve de la loi applicable, vous avez le droit :"),
          list([
            "D'accéder aux renseignements personnels que nous détenons à votre sujet;",
            "De faire rectifier des renseignements inexacts ou incomplets;",
            "De retirer votre consentement à certains traitements, sous réserve de restrictions légales ou contractuelles;",
            "De demander que nous cessions de diffuser vos renseignements personnels ou que nous dé-indexions un lien y menant, lorsque la diffusion vous cause un préjudice sérieux et que ce préjudice est nettement supérieur à l'intérêt du public à connaître ces renseignements ou à l'exercice de la liberté d'expression;",
            "De recevoir certains renseignements personnels que vous nous avez fournis, dans un format technologique structuré et couramment utilisé, ou d'en demander le transfert à une autre personne ou organisation, lorsque cela est techniquement possible;",
            "De déposer une plainte auprès de notre responsable de la protection des renseignements personnels et, si elle n'est pas résolue, auprès de la Commission d'accès à l'information du Québec.",
          ]),
          p(
            "Pour exercer l'un de ces droits, communiquez avec notre responsable de la protection des renseignements personnels à playver@gmail.com. Nous répondrons dans le délai prévu par la loi (actuellement 30 jours). Nous pourrions devoir vérifier votre identité avant de donner suite à une demande."
          ),
        ],
      },
      {
        id: "children",
        heading: "10. Vie privée des enfants et des mineurs",
        blocks: [
          p(
            "Le Service ne s'adresse pas aux enfants aux fins de création indépendante d'un compte, et nous ne recueillons pas sciemment de renseignements personnels directement auprès d'enfants de moins de 13 ans sans le consentement approprié. De nombreux participants aux événements sont des mineurs inscrits par un parent, un tuteur ou un entraîneur; l'adulte qui inscrit le mineur est responsable d'obtenir tout consentement parental ou du tuteur requis et de l'exactitude des renseignements du mineur. Si vous croyez qu'un mineur nous a fourni des renseignements personnels autrement que dans le cadre d'une telle inscription, communiquez avec nous à playver@gmail.com et nous prendrons les mesures appropriées."
          ),
        ],
      },
      {
        id: "cookies",
        heading: "11. Témoins",
        blocks: [
          p(
            "Nous utilisons des témoins et des technologies similaires pour exploiter et améliorer le Service. Consultez notre Politique relative aux témoins pour connaître les types de témoins que nous utilisons et comment gérer vos préférences."
          ),
        ],
      },
      {
        id: "changes",
        heading: "12. Modifications de la présente Politique",
        blocks: [
          p(
            "Nous pouvons mettre à jour la présente Politique de confidentialité de temps à autre. Si nous apportons des changements importants, nous fournirons un préavis raisonnable, par exemple par courriel ou avis dans l'application, avant l'entrée en vigueur des changements."
          ),
        ],
      },
      {
        id: "contact",
        heading: "13. Nous joindre",
        blocks: [
          p(
            "Toute question, demande ou plainte relative à la présente Politique de confidentialité ou à vos renseignements personnels peut être envoyée à notre responsable de la protection des renseignements personnels à playver@gmail.com."
          ),
        ],
      },
    ],
  },
};

export default privacy;
