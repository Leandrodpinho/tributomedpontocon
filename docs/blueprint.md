# **App Name**: Tributo Med.con Analyzer

## Core Features:

- Client Data Input: Text input fields to gather client financial and operational information (revenue, payroll, current tax regime, etc.) and an option to attach relevant documents like tax declarations and Simples Nacional extracts.
- Webhook Integration: Automatically sends the client's data via POST request to the specified webhook URL (https://n8n.mavenlabs.com.br/webhook-test/chatadv) for processing.
- AI Tax Scenario Analysis: Leverages AI tool to generate potential tax scenarios tailored for medical professionals and clinics based on input client data. AI to determine how to weight criteria like Fator R, ISS Fixo, Equiparacao Hospitalar, etc. to discover optimal solutions for the client. Considerations will include 'Novo aberturas de empresa' and 'Transferências de contabilidade'.
- Scenario Presentation: Presents the tax scenarios (including Anexo III/V Simples Nacional, Lucro Presumido, Lucro Real) with projected tax liabilities and savings in a clear, readable, structured format based on AI reasoning.
- Webhook Response Display: Displays the response received from the webhook in a text box on the same page, after processing the client data.
- IRPF Impact Calculation: Estimates the impact of different tax regimes on the client's IRPF (Imposto de Renda Pessoa Física), including pro-labore, profit distributions, and INSS contributions.

## Style Guidelines:

- Background color: Very dark blue-gray (#121E29). This color evokes professionalism.
- Primary color: Medium bright blue (#42A5F5) to provide contrast against the dark background and offer a sense of trustworthiness and competence.
- Accent color: Light vivid blue (#29B6F6) used sparingly for key interactive elements like buttons and links.
- Font: 'Inter', a sans-serif font for clear readability and a modern feel.