# Rumbo · CRM agéntico de prospección

CRM B2B en el que cinco agentes trabajan cada oportunidad (buscan cuentas, las investigan, puntúan el encaje, recomiendan producto y redactan el primer email) y una persona decide qué sale hacia el cliente. Cada acción, de un agente o de una persona, queda registrada.

**Demo:** https://rumbo-crm-omega.vercel.app

> Es una demo con una empresa y datos ficticios: Brisa Software, que vende software de gestión de personal. Las empresas, personas y correos son inventados y los dominios usan `.example`, reservado y sin dueño. No se envía ningún email.

## El problema

En prospección B2B, el comercial pierde la mayor parte del tiempo antes de hablar con nadie: entender a qué se dedica la empresa, decidir si encaja, elegir qué ofrecer y escribir un primer mensaje que no parezca una plantilla. Automatizarlo del todo produce spam. No automatizarlo no escala.

## Cómo lo resuelve

- **Agentes especializados, no un chat genérico.** El prospector propone cuentas que encajan con un perfil. El investigador prepara una ficha de cuenta con hipótesis, preguntas para la primera llamada y un mapa de empatía del contacto. El analista puntúa el encaje con el cliente ideal. El recomendador elige el producto con más afinidad. El redactor escribe el primer email.
- **Humano en el bucle.** Ningún email sale sin aprobación. La bandeja de aprobaciones reúne los borradores; se pueden editar, aprobar o descartar, y al aprobar el lead pasa a Contactado.
- **Puntuación y probabilidad explicables.** El encaje se calcula con reglas transparentes (sector, tamaño, necesidad, peso del contacto en la decisión y avance) y la probabilidad de cierre parte de la etapa y se ajusta con señales visibles, como el encaje, la inactividad o un paso vencido. Cada punto muestra su motivo, en lugar de una caja negra que el comercial no puede discutir.
- **Registro auditable.** La actividad de agentes muestra quién hizo qué, si fue con IA, con reglas o una persona, y cuánto tardó. Se exporta a CSV.
- **IA honesta.** Los agentes no tienen acceso a internet y lo saben: lo que deducen lo presentan como hipótesis. Todo lo generado con IA lleva su etiqueta.
- **Siempre funciona.** Si no hay clave de API, se agota la cuota o el modelo falla, cada agente tiene una versión con reglas y el flujo continúa.

## Funcionalidades

- **Panel:** pipeline abierto, previsión ponderada, tasa de cierre, tareas de hoy y vencidas, prioridades por encaje, embudo y actividad de los agentes.
- **Pipeline:** tablero con arrastrar y soltar, también con teclado, con responsable y probabilidad de cierre en cada tarjeta.
- **Leads, cuentas y contactos:** búsqueda, filtros por etapa, sector y responsable, orden por encaje, valor o actividad, y peso de cada contacto en la decisión.
- **Ficha de lead:** ejecución de los agentes paso a paso, email editable, ficha de cuenta, mapa de empatía, probabilidad de cierre desglosada, puntuación de encaje, afinidad con cada producto, siguiente paso con fecha, responsable e historial.
- **Prospector:** busca cuentas a partir de un perfil escrito en lenguaje natural. En la demo genera empresas ficticias.
- **Importación CSV:** detecta columnas, permite corregir el mapeo y valida cada fila antes de importar.
- **Analítica:** conversión, tasa de cierre, ticket medio, ciclo de venta, velocidad del pipeline, ingresos por mes, embudo de conversión, resultados por comercial, producto, sector y tamaño, y antigüedad del pipeline.
- **Equipo y roles:** cada comercial ve solo sus leads; la dirección comercial ve todo el equipo, reasigna leads y gestiona usuarios.
- **Cómo funciona:** explicación del flujo de agentes y un simulador para ver cómo cambian la puntuación, la recomendación y la probabilidad de cierre.
- **Atajos:** `N` para un lead nuevo y `/` para buscar.

## Autoría

Diseño de producto, flujo de agentes y elección del stack: **Carlos Gallego**. Construido con desarrollo asistido por IA.

## Stack

Next.js, React, Tailwind CSS, Zustand, dnd-kit y Gemini 2.5 Flash con salida estructurada, a través de una ruta de API en el servidor. Los datos se guardan en el navegador.

En producción, la persistencia iría a una base de datos (Postgres o Supabase) con autenticación por usuario, y los agentes se orquestarían en el servidor con colas y reintentos.

## Ejecutarlo en local

```bash
npm install
cp .env.example .env.local   # pega tu clave de Gemini en GEMINI_API_KEY
npm run dev
```

Sin clave también funciona: los agentes usan sus versiones con reglas.
