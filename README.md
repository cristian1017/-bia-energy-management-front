# Bia Energy Front

Frontend para consultar medidores, revisar sus lecturas eléctricas y visualizar anomalías y diagnósticos de IA desde un dashboard.

## Objetivo del proyecto

Ofrecer una interfaz operativa para explorar el estado y el consumo de una instalación eléctrica. El dashboard resume indicadores y anomalías; permite buscar, filtrar y ordenar medidores; y abre un diagnóstico individual con telemetría e historial de consumo, voltaje, corriente y factor de potencia.

La aplicación consume una API REST configurada por entorno. El backend no forma parte de este repositorio y debe ejecutarse por separado.

## Funcionalidades

- KPIs del periodo, conteo de medidores, anomalías, prioridad y confianza de IA.
- Gráficos de consumo promedio por medidor y distribución de anomalías.
- Tabla con búsqueda por identificador o ubicación, filtro por estado y ordenamiento por medidor, consumo, variación y severidad.
- Modal de diagnóstico con lecturas eléctricas, datos del medidor, anomalía y acción recomendada.
- Histórico individual seleccionable: consumo (kWh), voltaje (V), corriente (A) y factor de potencia.
- Acción para ejecutar un análisis global de IA y actualizar los datos del dashboard.
- Estados de carga, manejo de errores de API y diseño adaptable.

## Estructura del proyecto

```text
.
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── __tests__/
│   │   ├── Header.tsx
│   │   ├── KpiCards.tsx
│   │   ├── MeterModal.tsx
│   │   ├── MeterTable.tsx
│   │   └── OverviewCharts.tsx
│   ├── services/
│   │   ├── __tests__/
│   │   └── api.ts
│   ├── types/
│   │   └── api.ts
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── main.test.tsx
│   ├── main.tsx
│   └── setupTests.ts
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig*.json
├── vite.config.ts
└── README.md
```

## Stack tecnológico

| Área | Tecnología |
|---|---|
| Interfaz | React 19 y TypeScript 6 |
| Desarrollo y build | Vite 8 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Recharts 3 |
| Iconos | Lucide React |
| Cliente HTTP | Axios |
| Pruebas | Vitest 5, React Testing Library, user-event y jsdom |
| Cobertura | `@vitest/coverage-v8` |
| Calidad | ESLint 10 |

## API

La URL base se define con `VITE_API_BASE_URL`. El cliente Axios agrega estas rutas relativas:

| Método | Endpoint | Uso |
|---|---|---|
| `GET` | `/dashboard/summary` | Indicadores del dashboard |
| `GET` | `/meters` | Listado de medidores |
| `GET` | `/meters/:meterId` | Datos y ubicación del medidor |
| `GET` | `/meters/:meterId/readings` | Lecturas e históricos del medidor |
| `GET` | `/anomalies` | Anomalías para el resumen gráfico |
| `GET` | `/anomalies/:meterId` | Anomalías asociadas al medidor |
| `POST` | `/ai/analyze` | Iniciar análisis global de IA |
| `GET` | `/ai/analysis/:meterId` | Consultar el análisis del medidor |

## URLs de producción

- **Frontend:** [https://bia-energy-management-front.vercel.app/](https://bia-energy-management-front.vercel.app/)
- **Backend API:** [https://bia-energy-management-backend.vercel.app/](https://bia-energy-management-backend.vercel.app/)

## Requisitos

- Node.js compatible con Vite 8 (por ejemplo, Node 20.19+ o 22.12+).
- npm.
- API backend accesible desde el navegador. Si frontend y backend usan orígenes distintos, el backend debe permitir el origen del servidor Vite mediante CORS.

## Configuración y ejecución

Instala las dependencias desde la raíz del proyecto:

```bash
npm i
```

Configura la URL base de la API en `.env` o `.env.local`:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Usa la URL base real del backend. Vite expone al navegador las variables que empiezan con `VITE_`; no guardes secretos en ellas.

Inicia el frontend:

```bash
npm run dev
```

Vite mostrará la URL local, normalmente `http://localhost:5173`.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor local de desarrollo |
| `npm run build` | Verificación de TypeScript y build de producción |
| `npm run preview` | Servir localmente el build generado |
| `npm run lint` | Ejecutar ESLint |
| `npm test` | Ejecutar la suite de pruebas |
| `npm run test:watch` | Ejecutar Vitest en modo interactivo |
| `npm run test:coverage` | Ejecutar pruebas y exigir 100% en statements, branches, funciones y líneas |
