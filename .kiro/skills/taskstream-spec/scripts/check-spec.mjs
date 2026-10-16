#!/usr/bin/env node
/**
 * Validador Estructural y Semántico de Especificaciones SDD + BDD — TaskStream AI
 * Uso: node .agents/skills/taskstream-spec/scripts/check-spec.mjs specs/SPEC-NN.md
 */

import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_SECTIONS = [
  '## 1. Propósito y Alcance del Módulo',
  '## 2. Reglas de Dominio e Invariantes Vigentes',
  '## 3. Protocolo de Trabajo Paralelo por Rol (2 FE / 2 BE / 1 IA)',
  '## 4. Contratos de Datos (`packages/shared-schemas`) y Modelo Relacional 3NF (`schema.prisma`)',
  '## 5. Contratos de API, Colas BullMQ, Storage R2 e Integraciones Externas',
  '## 6. Interfaz de Usuario, Experiencia 3D (`ScrollTrigger`) y Visor Protegido',
  '## 7. Seguridad, Idempotencia Financiera y Defensa Anti-Prompt Injection',
  '## 8. Requisitos Funcionales (RF) y Escenarios BDD (`Dado / Cuando / Entonces`)',
  '## 9. Plan de Pruebas y Criterios de Verificación (`SPEC TESTEADA`)',
  '## 10. Casos de Borde, Manejo de Errores y Rollbacks',
  '## 11. Preguntas Abiertas y Decisiones Técnicas Operativas',
  '## 12. Registro de Cambios y Trazabilidad de Gobernanza IA',
];

const VALID_STATES = [
  'Redactada (DRAFTED)',
  'Implementada (IMPLEMENTED)',
  'Testeada (TESTED)',
  'Aprobada (APPROVED)',
];

const MANUAL_OPEN_PAYMENTS_SPECS = new Set(['SPEC-02', 'SPEC-06']);

function main() {
  const targetArg = process.argv[2];
  if (!targetArg) {
    console.error('Uso: node .agents/skills/taskstream-spec/scripts/check-spec.mjs <ruta-a-spec.md>');
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const specPath = path.resolve(repoRoot, targetArg);

  if (!fs.existsSync(specPath)) {
    console.error(`[ERROR] No existe el archivo de especificación: ${specPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(specPath, 'utf8');
  const errors = [];
  const warnings = [];

  // 1. Identificar ID de la Spec
  const fileBase = path.basename(specPath, '.md');
  const specIdMatch = fileBase.match(/^(SPEC-\d{2}[a-z]?)/i) || content.match(/\b(SPEC-\d{2}[a-z]?)\b/);
  const specId = specIdMatch ? specIdMatch[1].toUpperCase() : null;

  if (!specId) {
    errors.push('No se pudo identificar un código válido `SPEC-NN` (ej. SPEC-00 a SPEC-12) en el nombre o cabecera del archivo.');
  }

  // 2. Validar Estado del Ciclo SDD en Cabecera
  const stateLineMatch = content.match(/\|\s*\*\*Estado del Ciclo SDD\*\*\s*\|\s*`?([^|`\n]+)`?\s*\|/i);
  let currentState = null;
  if (!stateLineMatch) {
    errors.push('Falta la fila `| **Estado del Ciclo SDD** | ... |` en la tabla de metadatos de cabecera.');
  } else {
    currentState = stateLineMatch[1].trim();
    if (!VALID_STATES.includes(currentState)) {
      errors.push(
        `Estado SDD inválido: "${currentState}". Debe ser uno de: ${VALID_STATES.map((s) => `\`${s}\``).join(', ')}.`
      );
    }
  }

  // 3. Validar "Aprobada por / fecha" según el estado
  const approvedByMatch = content.match(/\|\s*\*\*Aprobada por \/ fecha\*\*\s*\|\s*`?([^|`\n]+)`?\s*\|/i);
  if (!approvedByMatch) {
    errors.push('Falta la fila `| **Aprobada por / fecha** | ... |` en la cabecera.');
  } else {
    const approvedVal = approvedByMatch[1].trim();
    if (currentState === 'Aprobada (APPROVED)' && (approvedVal === '—' || approvedVal === '-' || !approvedVal)) {
      errors.push('La spec está en estado `Aprobada (APPROVED)`, pero "Aprobada por / fecha" sigue vacío (`—`).');
    }
    if (currentState && currentState !== 'Aprobada (APPROVED)' && approvedVal !== '—' && approvedVal !== '-') {
      errors.push(
        `La spec está en estado \`${currentState}\` (no Aprobada), pero "Aprobada por / fecha" tiene valor ("${approvedVal}"). Debe ser \`—\`.`
      );
    }
  }

  // 4. Validar presencia y orden de las 12 secciones obligatorias
  let lastIndex = -1;
  for (const sectionHeading of REQUIRED_SECTIONS) {
    const idx = content.indexOf(sectionHeading);
    if (idx === -1) {
      errors.push(`Falta la sección obligatoria con su título exacto: "${sectionHeading}"`);
    } else {
      if (idx < lastIndex) {
        errors.push(`La sección "${sectionHeading}" está fuera de orden respecto a la plantilla oficial de 12 secciones.`);
      }
      lastIndex = idx;
    }
  }

  // 5. Detectar placeholders de plantilla sin reemplazar
  const unreplacedPlaceholders = content.match(/<(Título|Describe|Elemento|Explicitar|Invariante|Alcance|Nivel|Qué comprueba|Caso límite|ERROR_CODE)[^>]*>/g);
  if (unreplacedPlaceholders && unreplacedPlaceholders.length > 0) {
    errors.push(`Quedan placeholders de plantilla sin reemplazar: ${unreplacedPlaceholders.slice(0, 4).join(', ')}`);
  }
  if (/\bYYYY-MM-DD\b/.test(content)) {
    errors.push('Se encontró la fecha de plantilla `YYYY-MM-DD` sin reemplazar por una fecha real.');
  }

  // 6. Validar Requisitos Funcionales (RF-NN) y criterios BDD (Dado / Cuando / Entonces) en Sección 8
  const sec8Idx = content.indexOf('## 8. Requisitos Funcionales');
  const sec9Idx = content.indexOf('## 9. Plan de Pruebas');
  const sec12Idx = content.indexOf('## 12. Registro de Cambios');

  const rfIds = [];
  if (sec8Idx !== -1 && sec9Idx !== -1 && sec9Idx > sec8Idx) {
    const sec8Content = content.slice(sec8Idx, sec9Idx);
    const rfBlocks = [...sec8Content.matchAll(/###\s+`?(RF-\d{2,3})`?\b([^\n]*)\n([\s\S]*?)(?=###\s+`?RF-\d{2,3}|$)/g)];

    if (rfBlocks.length === 0) {
      errors.push('La Sección 8 no contiene ningún Requisito Funcional con el formato `### RF-01 — ...`.');
    }

    for (const block of rfBlocks) {
      const rfId = block[1];
      const rfBody = block[3];
      rfIds.push(rfId);

      const hasDado = /\*\*Dado\*\*/.test(rfBody);
      const hasCuando = /\*\*Cuando\*\*/.test(rfBody);
      const hasEntonces = /\*\*Entonces\*\*/.test(rfBody);

      if (!hasDado || !hasCuando || !hasEntonces) {
        errors.push(
          `El requisito \`${rfId}\` en la Sección 8 no incluye la tríada BDD completa en negrita (\`**Dado**\` / \`**Cuando**\` / \`**Entonces**\`).`
        );
      }
    }
  }

  // 7. Validar cobertura de cada RF-NN en la Sección 9 (Plan de Pruebas)
  if (sec9Idx !== -1 && rfIds.length > 0) {
    const sec10Idx = content.indexOf('## 10. Casos de Borde');
    const sec9Content = sec10Idx !== -1 ? content.slice(sec9Idx, sec10Idx) : content.slice(sec9Idx);
    for (const rfId of rfIds) {
      const rfRegex = new RegExp(`\\b${rfId}\\b`);
      if (!rfRegex.test(sec9Content)) {
        errors.push(`El requisito \`${rfId}\` no está citado en ninguna prueba de la Sección 9 (Plan de Pruebas).`);
      }
    }
  }

  // 8. Cruzar Tareas Asociadas con planning/taskboard.md
  const taskboardPath = path.join(repoRoot, 'planning', 'taskboard.md');
  if (specId && fs.existsSync(taskboardPath)) {
    const taskboardContent = fs.readFileSync(taskboardPath, 'utf8');
    const taskRows = [...taskboardContent.matchAll(/\|\s*\*\*`?(T-F\d-[A-Z0-9-]+)`?\*\*\s*\|[^|]+\|[^|]+\|\s*([^|]+)\|/g)];
    const expectedTasks = [];
    for (const row of taskRows) {
      const taskId = row[1].trim();
      const specsCol = row[2];
      if (new RegExp(`\\b${specId}\\b`).test(specsCol)) {
        expectedTasks.push(taskId);
      }
    }

    for (const taskId of expectedTasks) {
      if (!content.includes(taskId)) {
        errors.push(
          `La tarea \`${taskId}\` está asignada a \`${specId}\` en \`planning/taskboard.md\`, pero no aparece cubierta en esta especificación.`
        );
      }
    }
  }

  // 9. Verificar frontera de autoría manual 🛡️ cuando aplica
  if (specId && MANUAL_OPEN_PAYMENTS_SPECS.has(specId)) {
    if (!content.includes('🛡️') && !/open-payments\.service\.ts|escrow-payment\.service\.ts/i.test(content)) {
      errors.push(
        `La especificación \`${specId}\` involucra pagos abiertos de Interledger y debe demarcar explícitamente la frontera manual \`🛡️\` sobre \`open-payments.service.ts\` / \`escrow-payment.service.ts\`.`
      );
    }
  }

  // 10. Verificar contrato exacto AiAdvisorInputContractSchema en SPEC-08
  if (specId === 'SPEC-08') {
    if (!content.includes('AiAdvisorInputContractSchema') || !content.includes('AiAdvisorReportSchema')) {
      errors.push(
        '`SPEC-08` debe especificar obligatoriamente tanto `AiAdvisorInputContractSchema` como `AiAdvisorReportSchema`.'
      );
    }
  }

  // 11. Verificar tabla de Registro de Cambios en Sección 12
  if (sec12Idx !== -1) {
    const sec12Content = content.slice(sec12Idx);
    const hasTableSeparator = /\|\s*:?---+:?\s*\|/.test(sec12Content);
    if (!hasTableSeparator) {
      errors.push('La Sección 12 (Registro de Cambios) no contiene una tabla Markdown válida con fila separadora `| :--- |`.');
    }
  }

  // 12. Verificar sincronización con specs/README.md si existe
  const specsReadmePath = path.join(repoRoot, 'specs', 'README.md');
  if (specId && fs.existsSync(specsReadmePath)) {
    const readmeContent = fs.readFileSync(specsReadmePath, 'utf8');
    if (!readmeContent.includes(specId)) {
      warnings.push(`El índice \`specs/README.md\` existe pero aún no menciona a \`${specId}\`. Recuerda sincronizarlo.`);
    }
  }

  // 13. Señales de alarma y detección de anti-patrones de dominio en TaskStream AI
  const domainAntiPatterns = [
    {
      pattern: /useState\s*<[^>]*scroll|setScroll/i,
      msg: 'Se detectó almacenamiento de posición de scroll en `useState` (prohibido en CONTEXT.md §3.2; usar `useRef` dentro de `useGSAP()`).',
    },
  ];
  for (const item of domainAntiPatterns) {
    if (item.pattern.test(content)) {
      errors.push(item.msg);
    }
  }

  // Longitud estimada de lectura
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.ceil(wordCount / 220);
  if (readingMinutes > 25) {
    warnings.push(
      `La especificación tiene ${wordCount} palabras (~${readingMinutes} min de lectura). Verifica que no estés copiando bloques redundantes de CONTEXT.md o architecture-overview.md.`
    );
  }

  // Reporte final
  console.log(`\n=== Validación SDD TaskStream AI: ${path.relative(repoRoot, specPath)} (${specId || 'SIN-ID'}) ===`);
  console.log(`Estado detectado: ${currentState || 'No detectado'} | Requisitos RF: ${rfIds.length} | Palabras: ${wordCount}`);

  if (warnings.length > 0) {
    console.log(`\nAVISOS (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`  [AVISO] ${w}`);
    }
  }

  if (errors.length > 0) {
    console.error(`\nERRORES BLOQUEANTES (${errors.length}):`);
    for (const e of errors) {
      console.error(`  [ERROR] ${e}`);
    }
    process.exit(1);
  }

  console.log('\n[OK] Validación superada con 0 errores bloqueantes.');
}

main();
