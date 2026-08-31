# Orçamento Mensal

Aplicação web de gestão de orçamento mensal (React + Vite, sem UI libraries).

## Funcionalidades

- **Conta Corrente** — valor editável (clica no valor), ponto de partida do mês.
- **Rendimentos** — lista editável, adicionar/remover entradas com descrição e valor.
- **Despesas** — lista editável com categorias (Poupança, Essencial, Lazer, Outro), cada uma com cor própria, e totais por categoria.
- **Estimativa fim do mês** — `conta corrente + rendimentos − despesas`, com taxa de poupança e barra de progresso.
- **Persistência** — tudo é guardado automaticamente no `localStorage` a cada alteração.

Valores formatados em euros com notação portuguesa (vírgula decimal).

## Como correr

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção para dist/
npm run preview  # pré-visualizar o build
```
