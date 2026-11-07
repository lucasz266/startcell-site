# StartCell — protótipo de site institucional

Site responsivo em HTML, CSS e JavaScript, servido por um backend Node.js sem dependências externas.

## Rodar localmente

Requisitos: Node.js 20 ou superior.

```bash
npm start
```

Acesse: http://localhost:3000

## Funcionalidades

- Layout responsivo para celular, tablet e desktop.
- Navegação mobile.
- CTAs de WhatsApp e link para Instagram.
- Formulário validado no servidor que prepara uma mensagem e direciona para o WhatsApp.
- Endpoint de saúde: `/api/health`.
- SEO básico, Open Graph e dados estruturados Schema.org.
- Validação de campos, limite de requisições e campo honeypot.
- Não armazena dados do formulário no servidor.

## Configuração

O WhatsApp principal está configurado em `5566999858520` (número público encontrado em diretório). Para alterar no servidor:

```bash
BUSINESS_WHATSAPP=55DDDNÚMERO npm start
```

A variável `PORT` também pode ser configurada no ambiente de hospedagem.

## Antes de publicar — checklist obrigatório

Este material é um **protótipo comercial não oficial**. Não publicar nem apresentar como site oficial antes da autorização do estabelecimento.

Confirmar diretamente com a empresa:

1. Se a loja continua em funcionamento e se o endereço continua correto.
2. Autorização para usar nome, marca, logotipo, fotos e informações comerciais.
3. WhatsApp oficial, Instagram e horários de atendimento.
4. Serviços realmente oferecidos (não foram inventados serviços específicos neste protótipo).
5. Se vende aparelhos, acessórios e quais categorias devem aparecer.
6. Termos de privacidade e responsável pelo tratamento das mensagens.

O endereço e os contatos foram transcritos de cadastros públicos e precisam ser validados. Não há preços, garantias, depoimentos nem promessas técnicas inventadas neste projeto.

## Publicação

O projeto inclui backend Node.js. Use uma hospedagem que execute Node.js e configure `PORT` e `BUSINESS_WHATSAPP`. Hospedagem apenas de arquivos estáticos não executará o endpoint `/api/contact`.
