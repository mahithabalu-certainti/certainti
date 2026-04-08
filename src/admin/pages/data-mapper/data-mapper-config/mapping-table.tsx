import React, { useState, useEffect, useRef } from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import { AcceptIcon, ErrorInfoIcon, RejectIcon } from '../../../../assets';
import TruncateWithTooltip from '../../../../components/truncate-with-tooltip/truncate-with-tooltip';

import {
  BracketItem,
  BracketPopoverState,
  ConditionalExpression,
  ConditionalPopoverState,
  FieldExpression,
  FunctionPopoverState,
  MappingItem,
  ObjectItem,
  ObjectRidMap,
  SumOfPopoverState,
} from './mapping-table.types';
import {
  BracketPopover,
  ConditionalPopover,
  ExpressionChip,
  FunctionPopover,
  SumOfPopover,
} from './components';

interface MappingTableProps {
  mappings: MappingItem[];
  objectsList: ObjectItem[];
  onMappingsChange: (mappings: MappingItem[]) => void;
  formType?: 'fillable' | 'non-fillable';
}

const MappingTable: React.FC<MappingTableProps> = ({
  mappings,
  objectsList,
  onMappingsChange,
  formType,
}) => {
  const [localMappings, setLocalMappings] = useState<MappingItem[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<
    Record<string, boolean>
  >({});
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<
    Record<string, number>
  >({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Popover state
  const [functionPopover, setFunctionPopover] =
    useState<FunctionPopoverState | null>(null);
  const [conditionalPopover, setConditionalPopover] =
    useState<ConditionalPopoverState | null>(null);
  const [bracketPopover, setBracketPopover] =
    useState<BracketPopoverState | null>(null);
  const [sumOfPopover, setSumOfPopover] = useState<SumOfPopoverState | null>(
    null
  );

  // Popover input refs
  const functionPopoverInputRef = useRef<HTMLInputElement>(null);
  const clauseInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const clauseContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const returnInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const returnContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const bracketPopoverInputRef = useRef<HTMLInputElement>(null);
  const sumOfPopoverInputRef = useRef<HTMLInputElement>(null);

  // ─── Initialization & sync ─────────────────────────────────────────────────

  useEffect(() => {
    if (mappings && mappings.length > 0) {
      if (localMappings.length === 0) {
        const initializedMappings = mappings.map((mapping) => {
          let fieldExpressions = mapping.fieldExpressions || [];

          if (mapping.calculation_config && fieldExpressions.length === 0) {
            const objectRidMap = mapping.calculation_config as ObjectRidMap;
            const sortedKeys = Object.keys(objectRidMap)
              .map(Number)
              .sort((a, b) => a - b);

            fieldExpressions = sortedKeys
              .map((key) => {
                const value = objectRidMap[key];
                const isEven = key % 2 === 0;

                if (isEven) {
                  const operatorMap: Record<string, string> = {
                    add: '+',
                    subtract: '-',
                    multiply: '*',
                    divide: '/',
                  };
                  return {
                    type: 'operator' as const,
                    value: operatorMap[value as string] || (value as string),
                  };
                } else {
                  // Bracket expression
                  if (
                    typeof value === 'string' &&
                    value.startsWith('(') &&
                    value.endsWith(')')
                  ) {
                    const innerStr = value.slice(1, -1).trim();
                    const tokenizeBracketStr = (s: string): string[] => {
                      const toks: string[] = [];
                      let i = 0;
                      let cur = '';
                      while (i < s.length) {
                        const ch = s[i];
                        if (ch === '(') {
                          if (cur.trim()) {
                            toks.push(cur.trim());
                            cur = '';
                          }
                          let depth = 1;
                          let j = i + 1;
                          while (j < s.length && depth > 0) {
                            if (s[j] === '(') depth++;
                            if (s[j] === ')') depth--;
                            j++;
                          }
                          toks.push(s.slice(i, j));
                          i = j;
                        } else if (ch === ' ') {
                          if (cur.trim()) {
                            toks.push(cur.trim());
                            cur = '';
                          }
                          i++;
                        } else {
                          cur += ch;
                          i++;
                        }
                      }
                      if (cur.trim()) toks.push(cur.trim());
                      return toks;
                    };
                    const parseBracketTokens = (
                      tokens: string[]
                    ): BracketItem[] => {
                      const result: BracketItem[] = [];
                      const mathOpsList = [
                        '+',
                        '-',
                        '*',
                        '/',
                        '%',
                        '<',
                        '>',
                        '<=',
                        '>=',
                      ];
                      for (const tok of tokens) {
                        if (!tok) continue;
                        if (mathOpsList.includes(tok)) {
                          result.push({ type: 'operator', value: tok });
                        } else if (tok.startsWith('(') && tok.endsWith(')')) {
                          const nestedInner = tok.slice(1, -1).trim();
                          result.push({
                            type: 'bracket',
                            value: tok,
                            nestedItems: parseBracketTokens(
                              tokenizeBracketStr(nestedInner)
                            ),
                          });
                        } else if (tok.startsWith('#')) {
                          result.push({ type: 'manual', value: tok });
                        } else {
                          const objByRid = objectsList.find(
                            (obj) => obj.rid === tok
                          );
                          if (objByRid) {
                            result.push({
                              type: 'chip',
                              value: `${objByRid.parent_object}.${objByRid.object_name}`,
                            });
                          } else {
                            const objByPath = objectsList.find(
                              (obj) =>
                                `${obj.parent_object}.${obj.object_name}` ===
                                tok
                            );
                            if (objByPath) {
                              result.push({ type: 'chip', value: tok });
                            } else if (
                              !isNaN(Number(tok)) &&
                              tok.trim() !== ''
                            ) {
                              result.push({ type: 'number', value: tok });
                            } else {
                              result.push({ type: 'manual', value: tok });
                            }
                          }
                        }
                      }
                      return result;
                    };
                    return {
                      type: 'bracket' as const,
                      value,
                      bracketItems: parseBracketTokens(
                        tokenizeBracketStr(innerStr)
                      ),
                    };
                  }

                  // MIN/MAX function
                  if (
                    typeof value === 'string' &&
                    (value.startsWith('MIN(') || value.startsWith('MAX('))
                  ) {
                    const functionType = value.startsWith('MIN(')
                      ? 'MIN'
                      : 'MAX';
                    const argsMatch = value.match(/^(MIN|MAX)\((.*)\)$/);
                    if (argsMatch && argsMatch[2]) {
                      const args = argsMatch[2]
                        .split(',')
                        .map((arg) => arg.trim());
                      const displayArgs = args.map((arg) => {
                        if (arg.startsWith('#')) return arg;
                        const objectItem = objectsList.find(
                          (obj) => obj.rid === arg
                        );
                        return objectItem
                          ? `${objectItem.parent_object}.${objectItem.object_name}`
                          : arg;
                      });
                      return {
                        type: 'function' as const,
                        value: `${functionType}(${displayArgs.join(', ')})`,
                        functionType: functionType as 'MIN' | 'MAX',
                        functionArgs: args,
                      };
                    }
                  }

                  if (typeof value === 'string' && value.startsWith('#'))
                    return { type: 'manual' as const, value };
                  if (typeof value === 'number')
                    return { type: 'number' as const, value: value.toString() };
                  if (typeof value === 'string') {
                    const numberRegex = /^-?\d+(\.\d+)?$/;
                    if (numberRegex.test(value))
                      return { type: 'number' as const, value };
                  }

                  // SUM expression
                  if (
                    typeof value === 'string' &&
                    value.toUpperCase().startsWith('SUM(') &&
                    value.endsWith(')')
                  ) {
                    const innerArg = value.slice(4, -1).trim();
                    let sumOfArg: { type: 'chip' | 'manual'; value: string };
                    if (innerArg.startsWith('#')) {
                      sumOfArg = { type: 'manual', value: innerArg };
                    } else {
                      const objectItem = objectsList.find(
                        (obj) => obj.rid === innerArg
                      );
                      sumOfArg = objectItem
                        ? {
                            type: 'chip',
                            value: `${objectItem.parent_object}.${objectItem.object_name}`,
                          }
                        : { type: 'manual', value: innerArg };
                    }
                    return { type: 'sumOf' as const, value, sumOfArg };
                  }

                  // Conditional (IF)
                  if (typeof value === 'string' && value.startsWith('IF(')) {
                    const existingConditional = mapping.fieldExpressions?.find(
                      (exp) => exp.type === 'conditional' && exp.conditionalData
                    );
                    if (existingConditional?.conditionalData)
                      return existingConditional;

                    const parseConditionalString = (str: string) => {
                      const clauses: import('./mapping-table.types').ConditionalClause[] =
                        [];
                      const tokenize = (input: string): string[] => {
                        const tokens: string[] = [];
                        let current = '';
                        let inManualValue = false;
                        for (let i = 0; i < input.length; i++) {
                          const char = input[i];
                          if (char === '(' && !inManualValue) {
                            // Check if current ends with MIN or MAX (possibly with something before it)
                            const trimmed = current.trim();
                            const funcMatch =
                              trimmed.match(/^(.*?)(MIN|MAX)$/i);
                            if (funcMatch) {
                              // Split: push the part before MIN/MAX if exists
                              if (funcMatch[1]) {
                                tokens.push(funcMatch[1]);
                              }
                              // Now handle MIN(...) or MAX(...) as single token
                              let depth = 1;
                              let j = i + 1;
                              while (j < input.length && depth > 0) {
                                if (input[j] === '(') depth++;
                                if (input[j] === ')') depth--;
                                j++;
                              }
                              // Push complete function: MIN(...) or MAX(...)
                              tokens.push(funcMatch[2] + input.slice(i, j));
                              i = j - 1;
                              current = '';
                            } else {
                              // Regular bracket expression
                              if (current.trim()) {
                                tokens.push(current.trim());
                                current = '';
                              }
                              let depth = 1;
                              let j = i + 1;
                              while (j < input.length && depth > 0) {
                                if (input[j] === '(') depth++;
                                if (input[j] === ')') depth--;
                                j++;
                              }
                              tokens.push(input.slice(i, j));
                              i = j - 1;
                            }
                          } else if (char === '#' && !inManualValue) {
                            if (current.trim()) {
                              tokens.push(current.trim());
                              current = '';
                            }
                            inManualValue = true;
                            current = char;
                          } else if (char === ' ' && !inManualValue) {
                            if (current.trim()) {
                              tokens.push(current.trim());
                              current = '';
                            }
                          } else if (char === ' ' && inManualValue) {
                            const remaining = input.substring(i + 1);
                            const nextToken = remaining.split(' ')[0];
                            const isOperator = [
                              '===',
                              '!==',
                              '&&',
                              '||',
                              '+',
                              '-',
                              '*',
                              '/',
                              '%',
                              '>',
                              '<',
                              '>=',
                              '<=',
                            ].includes(nextToken);
                            const isRid = objectsList.some(
                              (obj) => obj.rid === nextToken
                            );
                            const isBracket = nextToken.startsWith('(');
                            const isFunction = /^(MIN|MAX)\(/i.test(nextToken);
                            if (
                              isOperator ||
                              isRid ||
                              isBracket ||
                              isFunction
                            ) {
                              if (current.trim()) {
                                tokens.push(current.trim());
                                current = '';
                              }
                              inManualValue = false;
                            } else {
                              current += char;
                            }
                          } else {
                            current += char;
                          }
                        }
                        if (current.trim()) tokens.push(current.trim());
                        return tokens;
                      };
                      const tokenizeBracket = (s: string): string[] => {
                        const toks: string[] = [];
                        let i = 0;
                        let cur = '';
                        while (i < s.length) {
                          const ch = s[i];
                          if (ch === '(') {
                            if (cur.trim()) {
                              toks.push(cur.trim());
                              cur = '';
                            }
                            let depth = 1;
                            let j = i + 1;
                            while (j < s.length && depth > 0) {
                              if (s[j] === '(') depth++;
                              if (s[j] === ')') depth--;
                              j++;
                            }
                            toks.push(s.slice(i, j));
                            i = j;
                          } else if (ch === ' ') {
                            if (cur.trim()) {
                              toks.push(cur.trim());
                              cur = '';
                            }
                            i++;
                          } else {
                            cur += ch;
                            i++;
                          }
                        }
                        if (cur.trim()) toks.push(cur.trim());
                        return toks;
                      };
                      const parseBracketTokens = (
                        bTokens: string[]
                      ): BracketItem[] => {
                        const result: BracketItem[] = [];
                        const mathOpsList = [
                          '+',
                          '-',
                          '*',
                          '/',
                          '%',
                          '<',
                          '>',
                          '<=',
                          '>=',
                        ];
                        for (const tok of bTokens) {
                          if (!tok) continue;
                          if (mathOpsList.includes(tok)) {
                            result.push({ type: 'operator', value: tok });
                          } else if (tok.startsWith('(') && tok.endsWith(')')) {
                            const nestedInner = tok.slice(1, -1).trim();
                            result.push({
                              type: 'bracket',
                              value: tok,
                              nestedItems: parseBracketTokens(
                                tokenizeBracket(nestedInner)
                              ),
                            });
                          } else if (tok.startsWith('#')) {
                            result.push({ type: 'manual', value: tok });
                          } else {
                            const objByRid = objectsList.find(
                              (obj) => obj.rid === tok
                            );
                            if (objByRid) {
                              result.push({
                                type: 'chip',
                                value: `${objByRid.parent_object}.${objByRid.object_name}`,
                              });
                            } else {
                              const objByPath = objectsList.find(
                                (obj) =>
                                  `${obj.parent_object}.${obj.object_name}` ===
                                  tok
                              );
                              if (objByPath) {
                                result.push({ type: 'chip', value: tok });
                              } else if (
                                !isNaN(Number(tok)) &&
                                tok.trim() !== ''
                              ) {
                                result.push({ type: 'number', value: tok });
                              } else {
                                result.push({ type: 'manual', value: tok });
                              }
                            }
                          }
                        }
                        return result;
                      };
                      const buildExpressions = (
                        input: string
                      ): FieldExpression[] => {
                        return tokenize(input)
                          .map((part) => {
                            if (!part) return null;
                            if (part.startsWith('(') && part.endsWith(')')) {
                              const innerStr = part.slice(1, -1).trim();
                              return {
                                type: 'bracket' as const,
                                value: part,
                                bracketItems: parseBracketTokens(
                                  tokenizeBracket(innerStr)
                                ),
                              };
                            }
                            // Check for MIN/MAX functions
                            const funcMatch =
                              part.match(/^(MIN|MAX)\((.*)\)$/i);
                            if (funcMatch) {
                              const functionType =
                                funcMatch[1].toUpperCase() as 'MIN' | 'MAX';
                              const argsStr = funcMatch[2];
                              const args = argsStr
                                .split(',')
                                .map((arg) => arg.trim());

                              // Convert RIDs in args to display format (without @ prefix)
                              const displayArgs = args.map((arg) => {
                                if (arg.startsWith('#')) return arg; // Manual value
                                if (!isNaN(Number(arg))) return arg; // Number

                                // Check if it's a RID
                                const objectItem = objectsList.find(
                                  (obj) => obj.rid === arg
                                );
                                if (objectItem) {
                                  return `${objectItem.parent_object}.${objectItem.object_name}`;
                                }
                                return arg; // Unknown, keep as-is
                              });

                              return {
                                type: 'function' as const,
                                value: `${functionType}(${displayArgs.join(', ')})`,
                                functionType,
                                functionArgs: args, // Keep original RIDs for payload
                              };
                            }
                            const objectItem = objectsList.find(
                              (obj) => obj.rid === part
                            );
                            if (objectItem)
                              return {
                                type: 'chip' as const,
                                value: `${objectItem.parent_object}.${objectItem.object_name}`,
                              };
                            const isOperator = [
                              '===',
                              '!==',
                              '&&',
                              '||',
                              '+',
                              '-',
                              '*',
                              '/',
                              '%',
                              '>',
                              '<',
                              '>=',
                              '<=',
                            ].includes(part);
                            if (isOperator)
                              return { type: 'operator' as const, value: part };
                            if (!isNaN(Number(part)) && part.trim() !== '')
                              return { type: 'number' as const, value: part };
                            return { type: 'manual' as const, value: part };
                          })
                          .filter(Boolean) as FieldExpression[];
                      };

                      let hasNewFormat = false;
                      let parsePos = 0;
                      const parseNewFormat = (s: string) => {
                        while (parsePos < s.length) {
                          while (parsePos < s.length && s[parsePos] === ' ')
                            parsePos++;
                          if (parsePos >= s.length) break;
                          let clauseType: 'IF' | 'ELSE_IF' | 'ELSE' | null =
                            null;
                          if (s.substring(parsePos).startsWith('ELSE IF')) {
                            clauseType = 'ELSE_IF';
                            parsePos += 7;
                          } else if (s.substring(parsePos).startsWith('ELSE')) {
                            clauseType = 'ELSE';
                            parsePos += 4;
                          } else if (s.substring(parsePos).startsWith('IF')) {
                            clauseType = 'IF';
                            parsePos += 2;
                          } else {
                            parsePos++;
                            continue;
                          }

                          while (parsePos < s.length && s[parsePos] === ' ')
                            parsePos++;
                          let conditionContent = '';
                          if (
                            clauseType !== 'ELSE' &&
                            parsePos < s.length &&
                            s[parsePos] === '('
                          ) {
                            parsePos++;
                            let depth = 1;
                            const condStart = parsePos;
                            while (parsePos < s.length && depth > 0) {
                              if (s[parsePos] === '(') depth++;
                              if (s[parsePos] === ')') depth--;
                              if (depth > 0) parsePos++;
                            }
                            conditionContent = s
                              .substring(condStart, parsePos)
                              .trim();
                            parsePos++;
                          }
                          while (parsePos < s.length && s[parsePos] === ' ')
                            parsePos++;
                          if (parsePos < s.length && s[parsePos] === '{')
                            parsePos++;
                          while (parsePos < s.length && s[parsePos] === ' ')
                            parsePos++;
                          if (s.substring(parsePos).startsWith('THEN'))
                            parsePos += 4;
                          else if (s.substring(parsePos).startsWith('RETURN'))
                            parsePos += 6;
                          while (parsePos < s.length && s[parsePos] === ' ')
                            parsePos++;

                          let returnContent = '';
                          let braceDepth = 1;
                          const retStart = parsePos;
                          while (parsePos < s.length && braceDepth > 0) {
                            if (s[parsePos] === '{') braceDepth++;
                            if (s[parsePos] === '}') {
                              braceDepth--;
                              if (braceDepth === 0) break;
                            }
                            parsePos++;
                          }
                          returnContent = s
                            .substring(retStart, parsePos)
                            .trim();
                          if (parsePos < s.length) parsePos++;

                          hasNewFormat = true;
                          clauses.push({
                            type: clauseType,
                            condition: conditionContent,
                            result: returnContent,
                            expressions: buildExpressions(conditionContent),
                            returnExpressions: buildExpressions(returnContent),
                            inputValue: '',
                          });
                        }
                      };
                      parseNewFormat(str);

                      if (!hasNewFormat) {
                        const oldFormatRegex = /(IF|ELSE IF|ELSE)\((.*?)\)/g;
                        let match;
                        while ((match = oldFormatRegex.exec(str)) !== null) {
                          const type =
                            match[1] === 'ELSE IF'
                              ? 'ELSE_IF'
                              : (match[1] as 'IF' | 'ELSE');
                          const content = match[2];
                          if (type === 'ELSE') {
                            clauses.push({
                              type,
                              result: content,
                              returnExpressions: buildExpressions(content),
                              inputValue: '',
                            });
                          } else {
                            const lastCommaIndex = content.lastIndexOf(',');
                            let cond = content;
                            let res = '';
                            if (lastCommaIndex !== -1) {
                              cond = content
                                .substring(0, lastCommaIndex)
                                .trim();
                              res = content
                                .substring(lastCommaIndex + 1)
                                .trim();
                            }
                            clauses.push({
                              type,
                              condition: cond,
                              result: res,
                              expressions: buildExpressions(cond),
                              returnExpressions: buildExpressions(res),
                              inputValue: '',
                            });
                          }
                        }
                      }
                      return clauses;
                    };

                    const clauses = parseConditionalString(value as string);
                    if (clauses.length > 0)
                      return {
                        type: 'conditional' as const,
                        value: value as string,
                        conditionalData: { clauses },
                      };
                  }

                  // Plain object RID
                  const objectItem = objectsList.find(
                    (obj) => obj.rid === value
                  );
                  if (objectItem)
                    return {
                      type: 'chip' as const,
                      value: `${objectItem.parent_object}.${objectItem.object_name}`,
                    };
                  return null;
                }
              })
              .filter(Boolean) as FieldExpression[];
          }

          return {
            ...mapping,
            fieldExpressions,
            inputValue: mapping.inputValue || '',
          };
        });
        setLocalMappings(initializedMappings);
        onMappingsChange(initializedMappings);
      } else {
        setLocalMappings((prev) =>
          prev.map((localMap) => {
            const propMap = mappings.find((m) => m.rid === localMap.rid);
            if (
              propMap &&
              (localMap.fieldIdError !== propMap.fieldIdError ||
                localMap.targetError !== propMap.targetError)
            ) {
              return {
                ...localMap,
                fieldIdError: propMap.fieldIdError,
                targetError: propMap.targetError,
              };
            }
            return localMap;
          })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, objectsList, localMappings.length]);

  useEffect(() => {
    localMappings.forEach((mapping) => {
      const inputValue = mapping.inputValue || '';
      const atIndex = inputValue.lastIndexOf('@');
      if (atIndex !== -1 && inputValue.substring(atIndex + 1).includes('.')) {
        setShowAutocomplete((prev) => ({ ...prev, [mapping.rid]: true }));
      }
    });
  }, [localMappings]);

  // ─── Target options ────────────────────────────────────────────────────────

  const targetOptions = React.useMemo(() => {
    const options: Record<string, Record<string, string>> = {};
    if (!Array.isArray(objectsList)) return options;
    objectsList.forEach((item) => {
      if (!options[item.parent_object]) options[item.parent_object] = {};
      options[item.parent_object][item.object_name] = item.rid;
    });
    return options;
  }, [objectsList]);

  // ─── buildCalculationConfig ────────────────────────────────────────────────

  const buildCalculationConfig = (
    expressions: FieldExpression[]
  ): ObjectRidMap | null => {
    const objectRidMap: ObjectRidMap = {};
    let currentIndex = 1;
    expressions.forEach((exp) => {
      if (exp.type === 'chip') {
        const [parent, child] = exp.value.split('.', 2);
        const objectId = targetOptions[parent]?.[child] || '';
        if (objectId) {
          objectRidMap[currentIndex] = objectId;
          currentIndex += 2;
        }
      } else if (exp.type === 'manual') {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'number') {
        objectRidMap[currentIndex] = parseFloat(exp.value);
        currentIndex += 2;
      } else if (exp.type === 'function') {
        if (exp.functionType && exp.functionArgs) {
          objectRidMap[currentIndex] =
            `${exp.functionType}(${exp.functionArgs.join(', ')})`;
          currentIndex += 2;
        }
      } else if (
        exp.type === 'bracket' ||
        exp.type === 'conditional' ||
        exp.type === 'sumOf'
      ) {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'operator') {
        if (currentIndex > 1) {
          const operatorMap: Record<string, string> = {
            '+': 'add',
            '-': 'subtract',
            '*': 'multiply',
            '/': 'divide',
          };
          objectRidMap[currentIndex - 1] = operatorMap[exp.value] || exp.value;
        }
      }
    });
    return Object.keys(objectRidMap).length > 0 ? objectRidMap : null;
  };

  // ─── Field ID handlers ─────────────────────────────────────────────────────

  const handleFieldIdChange = (rid: string, value: string): void => {
    const updatedMappings = localMappings.map((mapping) => {
      if (mapping.rid === rid) {
        let newStatus = mapping.status;
        if (!value || value.trim() === '') {
          newStatus = 'rejected';
        } else if (mapping.status !== 'anomaly') {
          newStatus = 'accepted';
        }
        return {
          ...mapping,
          field_id: value,
          fieldIdError: undefined,
          status: newStatus,
        };
      }
      return mapping;
    });
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleAcceptAnomaly = (rid: string): void => {
    const updatedMappings = localMappings.map((mapping) =>
      mapping.rid === rid
        ? { ...mapping, status: 'accepted', fieldIdError: undefined }
        : mapping
    );
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleRejectAnomaly = (rid: string): void => {
    const updatedMappings = localMappings.map((mapping) =>
      mapping.rid === rid
        ? {
            ...mapping,
            field_id: '',
            status: 'rejected',
            fieldIdError: undefined,
          }
        : mapping
    );
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  // ─── Source field input handlers ───────────────────────────────────────────

  const handleInputChange = (rid: string, value: string): void => {
    const lastChar = value.slice(-1);
    const isOperator = ['+', '-', '*', '/'].includes(lastChar);

    if (isOperator && value.length === 1) {
      setLocalMappings((prev) => {
        const updated = prev.map((mapping) => {
          if (mapping.rid === rid) {
            const newExpressions = [
              ...(mapping.fieldExpressions || []),
              { type: 'operator' as const, value: lastChar },
            ];
            return {
              ...mapping,
              fieldExpressions: newExpressions,
              calculation_config: buildCalculationConfig(newExpressions),
              targetError: undefined,
              inputValue: '',
            };
          }
          return mapping;
        });
        onMappingsChange(updated);
        return updated;
      });
      return;
    }

    setLocalMappings((prev) =>
      prev.map((mapping) =>
        mapping.rid === rid
          ? { ...mapping, inputValue: value, targetError: undefined }
          : mapping
      )
    );
    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1;
    setShowAutocomplete((prev) => ({ ...prev, [rid]: shouldShow }));
    setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));
    onMappingsChange(
      localMappings.map((m) =>
        m.rid === rid ? { ...m, inputValue: value, targetError: undefined } : m
      )
    );
  };

  const handleInputBlur = (rid: string): void => {
    setTimeout(() => {
      setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
    }, 150);
  };

  const handleAutocompleteSelect = (
    rid: string,
    selectedValue: string
  ): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const currentInput = mapping.inputValue || '';
    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const isCompleteProperty = selectedValue.includes('.');
    if (!isCompleteProperty) {
      const newInputValue =
        currentInput.substring(0, atIndex + 1) + selectedValue + '.';
      setLocalMappings(
        localMappings.map((m) =>
          m.rid === rid ? { ...m, inputValue: newInputValue } : m
        )
      );
      setShowAutocomplete((prev) => ({ ...prev, [rid]: true }));
      setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));
      return;
    }

    const beforeAt = currentInput.substring(0, atIndex).trim();
    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === rid) {
          const newExpressions = [...(m.fieldExpressions || [])];
          if (beforeAt && ['+', '-', '*', '/'].includes(beforeAt))
            newExpressions.push({ type: 'operator' as const, value: beforeAt });
          newExpressions.push({ type: 'chip' as const, value: selectedValue });
          return {
            ...m,
            fieldExpressions: newExpressions,
            inputValue: '',
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });
    setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
  };

  const removeChip = (rid: string, indexToRemove: number): void => {
    setLocalMappings((prev) => {
      const updated = prev.map((mapping) => {
        if (mapping.rid === rid) {
          const newExpressions = (mapping.fieldExpressions || []).filter(
            (_, index) => index !== indexToRemove
          );
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
          };
        }
        return mapping;
      });
      onMappingsChange(updated);
      return updated;
    });
  };

  const removeOperator = (rid: string, indexToRemove: number): void => {
    setLocalMappings((prev) => {
      const updated = prev.map((mapping) => {
        if (mapping.rid === rid) {
          const newExpressions = (mapping.fieldExpressions || []).filter(
            (_, index) => index !== indexToRemove
          );
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
          };
        }
        return mapping;
      });
      onMappingsChange(updated);
      return updated;
    });
  };

  const handleKeyDown = (rid: string, event: React.KeyboardEvent): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    const currentInput = mapping?.inputValue || '';

    if (event.key === 'Enter') {
      const functionInput = currentInput.trim().toUpperCase();

      if (currentInput.trim() === '(') {
        event.preventDefault();
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setBracketPopover({
            rid,
            items: [],
            inputValue: '',
            anchorEl: containerElement,
            source: 'main',
          });
          setLocalMappings((prev) =>
            prev.map((m) => (m.rid === rid ? { ...m, inputValue: '' } : m))
          );
        }
        return;
      }

      if (functionInput === 'MIN' || functionInput === 'MAX') {
        event.preventDefault();
        const containerElement = containerRefs.current[rid];
        if (containerElement)
          setFunctionPopover({
            rid,
            type: functionInput as 'MIN' | 'MAX',
            args: [],
            inputValue: '',
            anchorEl: containerElement,
          });
        return;
      }

      if (functionInput === 'SUM' || functionInput === 'SUM(') {
        event.preventDefault();
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setSumOfPopover({ rid, inputValue: '', anchorEl: containerElement });
          setLocalMappings((prev) =>
            prev.map((m) => (m.rid === rid ? { ...m, inputValue: '' } : m))
          );
        }
        return;
      }

      if (functionInput === 'IF') {
        event.preventDefault();
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setConditionalPopover({
            rid,
            clauses: [
              {
                type: 'IF',
                condition: '',
                expressions: [],
                inputValue: '',
                result: '',
                returnExpressions: [],
                returnInputValue: '',
              },
            ],
            anchorEl: containerElement,
          });
        }
        return;
      }

      if (currentInput.trim().startsWith('#')) {
        event.preventDefault();
        const manualValue = currentInput.trim();
        if (manualValue.length > 1) {
          setLocalMappings((prev) => {
            const updated = prev.map((m) => {
              if (m.rid === rid) {
                const newExpressions = [
                  ...(m.fieldExpressions || []),
                  { type: 'manual' as const, value: manualValue },
                ];
                return {
                  ...m,
                  fieldExpressions: newExpressions,
                  calculation_config: buildCalculationConfig(newExpressions),
                  targetError: undefined,
                  inputValue: '',
                };
              }
              return m;
            });
            onMappingsChange(updated);
            return updated;
          });
        }
        return;
      }

      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(currentInput.trim())) {
        event.preventDefault();
        setLocalMappings((prev) => {
          const updated = prev.map((m) => {
            if (m.rid === rid) {
              const newExpressions = [
                ...(m.fieldExpressions || []),
                { type: 'number' as const, value: currentInput.trim() },
              ];
              return {
                ...m,
                fieldExpressions: newExpressions,
                calculation_config: buildCalculationConfig(newExpressions),
                targetError: undefined,
                inputValue: '',
              };
            }
            return m;
          });
          onMappingsChange(updated);
          return updated;
        });
        return;
      }
    }

    if (!showAutocomplete[rid]) return;

    const options = getFilteredOptions(rid);
    const currentIndex = selectedOptionIndex[rid] || 0;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedOptionIndex((prev) => ({
          ...prev,
          [rid]: Math.min(currentIndex + 1, options.length - 1),
        }));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedOptionIndex((prev) => ({
          ...prev,
          [rid]: Math.max(currentIndex - 1, 0),
        }));
        break;
      case 'Enter':
        event.preventDefault();
        if (options[currentIndex])
          handleAutocompleteSelect(rid, options[currentIndex]);
        break;
      case 'Escape': {
        const m = localMappings.find((m) => m.rid === rid);
        if (m) {
          const ci = m.inputValue || '';
          const ai = ci.lastIndexOf('@');
          if (ai !== -1) {
            const afterAt = ci.substring(ai + 1);
            const dotCount = (afterAt.match(/\./g) || []).length;
            if (afterAt && (dotCount < 1 || afterAt.endsWith('.'))) {
              setLocalMappings((prev) =>
                prev.map((mm) =>
                  mm.rid === rid ? { ...mm, inputValue: '' } : mm
                )
              );
            }
          }
        }
        setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
        break;
      }
    }
  };

  // ─── Popover helper functions ──────────────────────────────────────────────

  const getFilteredOptions = (
    rid: string,
    customSearchText?: string
  ): string[] => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return [];

    let searchText: string;
    if (customSearchText !== undefined) {
      searchText = customSearchText;
    } else {
      const currentInput = mapping.inputValue || '';
      const atIndex = currentInput.lastIndexOf('@');
      if (atIndex === -1) return [];
      searchText = currentInput.substring(atIndex + 1);
    }

    const lowerSearchText = searchText.toLowerCase();
    const filteredObjectsList = objectsList.filter(
      (obj) => obj.field_type === mapping.field_type
    );
    const filteredTargetOptions: Record<string, Record<string, string>> = {};
    filteredObjectsList.forEach((item) => {
      if (!filteredTargetOptions[item.parent_object])
        filteredTargetOptions[item.parent_object] = {};
      filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
    });

    if (lowerSearchText === '') return Object.keys(filteredTargetOptions);

    const dotCount = (lowerSearchText.match(/\./g) || []).length;
    if (dotCount >= 1) {
      const [parentKeyLower, childKeyLower = ''] = lowerSearchText.split(
        '.',
        2
      );
      const actualParentKey = Object.keys(filteredTargetOptions).find(
        (key) => key.toLowerCase() === parentKeyLower
      );
      if (actualParentKey && filteredTargetOptions[actualParentKey]) {
        const children = filteredTargetOptions[actualParentKey];
        if (childKeyLower === '')
          return Object.keys(children).map(
            (child) => `${actualParentKey}.${child}`
          );
        return Object.keys(children)
          .filter((child) => child.toLowerCase().includes(childKeyLower))
          .map((child) => `${actualParentKey}.${child}`);
      }
      return [];
    }

    return Object.keys(filteredTargetOptions).filter((key) =>
      key.toLowerCase().includes(lowerSearchText)
    );
  };

  const getDisplayName = (optionValue: string, rid: string): string => {
    const dotCount = (optionValue.match(/\./g) || []).length;
    if (dotCount === 1) return optionValue;

    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return optionValue;

    const filteredObjectsList = objectsList.filter(
      (obj) => obj.field_type === mapping.field_type
    );
    const filteredTargetOptions: Record<string, Record<string, string>> = {};
    filteredObjectsList.forEach((item) => {
      if (!filteredTargetOptions[item.parent_object])
        filteredTargetOptions[item.parent_object] = {};
      filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
    });

    const parentData = filteredTargetOptions[optionValue];
    if (parentData) return `${optionValue} (${Object.keys(parentData).length})`;
    return optionValue;
  };

  const getPopoverFilteredOptions = (searchText: string): string[] => {
    const rid =
      functionPopover?.rid ||
      conditionalPopover?.rid ||
      bracketPopover?.rid ||
      sumOfPopover?.rid;
    if (!rid) return [];
    return getFilteredOptions(rid, searchText);
  };

  const getPopoverDisplayName = (option: string): string => {
    const rid =
      functionPopover?.rid ||
      conditionalPopover?.rid ||
      bracketPopover?.rid ||
      sumOfPopover?.rid;
    if (!rid) return option;
    return getDisplayName(option, rid);
  };

  // ─── Display label builders ────────────────────────────────────────────────

  const buildBracketDisplayLabel = (
    items: BracketItem[],
    rid: string
  ): string => {
    if (!items || items.length === 0) return '(...)';
    return items
      .map((it) => {
        if (it.type === 'chip') return getDisplayName(it.value, rid);
        if (it.type === 'bracket' && it.nestedItems)
          return `(${buildBracketDisplayLabel(it.nestedItems, rid)})`;
        return it.value;
      })
      .join(' ');
  };

  const buildExpressionDisplayLabel = (
    expressions: FieldExpression[],
    rid: string
  ): string => {
    if (!expressions || expressions.length === 0) return '';
    return expressions
      .map((exp) => {
        if (exp.type === 'chip') return getDisplayName(exp.value, rid);
        if (exp.type === 'bracket')
          return `(${buildBracketDisplayLabel(exp.bracketItems || [], rid)})`;
        return exp.value;
      })
      .join(' ');
  };

  const buildConditionalDisplayLabel = (
    conditionalData: ConditionalExpression | undefined,
    rid: string
  ): string => {
    if (!conditionalData || !conditionalData.clauses) return 'IF...';
    return conditionalData.clauses
      .map((clause) => {
        const condStr = buildExpressionDisplayLabel(
          clause.expressions || [],
          rid
        );
        const retStr = buildExpressionDisplayLabel(
          clause.returnExpressions || [],
          rid
        );
        if (clause.type === 'IF') return `IF(${condStr}) { THEN ${retStr} }`;
        if (clause.type === 'ELSE_IF')
          return `ELSE IF(${condStr}) { THEN ${retStr} }`;
        return `ELSE { THEN ${retStr} }`;
      })
      .join(' ');
  };

  // ─── Chip click handlers (open popovers for edit) ──────────────────────────

  const handleFunctionChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'function') return;
    const args: FieldExpression[] =
      expression.functionArgs?.map((arg) => {
        if (arg.startsWith('#')) return { type: 'manual' as const, value: arg };
        const objectItem = objectsList.find((obj) => obj.rid === arg);
        return objectItem
          ? {
              type: 'chip' as const,
              value: `${objectItem.parent_object}.${objectItem.object_name}`,
            }
          : { type: 'manual' as const, value: arg };
      }) || [];
    const containerElement = containerRefs.current[rid];
    if (containerElement)
      setFunctionPopover({
        rid,
        type: expression.functionType || 'MIN',
        args,
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
      });
  };

  const handleBracketChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'bracket') return;
    const containerElement = containerRefs.current[rid];
    if (containerElement)
      setBracketPopover({
        rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
        source: 'main',
      });
  };

  const handleConditionalChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (
      !expression ||
      expression.type !== 'conditional' ||
      !expression.conditionalData
    )
      return;
    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      const loadedClauses = expression.conditionalData.clauses.map((c) => ({
        ...c,
        expressions:
          c.expressions ||
          (c.condition
            ? [{ type: 'manual' as const, value: c.condition }]
            : []),
        inputValue: '',
        showAutocomplete: false,
        autocompleteIndex: 0,
        returnExpressions: c.returnExpressions || [],
        returnInputValue: '',
        returnShowAutocomplete: false,
        returnAutocompleteIndex: 0,
      }));
      setConditionalPopover({
        rid,
        clauses: loadedClauses,
        anchorEl: containerElement,
        editingIndex: index,
      });
    }
  };

  const handleSumOfChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'sumOf') return;
    const containerElement = containerRefs.current[rid];
    if (containerElement)
      setSumOfPopover({
        rid,
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
        selectedArg: expression.sumOfArg,
      });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <TableContainer
      sx={{
        boxShadow: 'none',
        overflow: 'auto',
        maxHeight: 'calc(100vh - 250px)',
        minHeight: 'auto',
        height: 'fit-content',
        border: '1px solid #CBD6E2',
        borderRadius: 1,
      }}
    >
      <MuiTable
        stickyHeader
        sx={{
          minWidth: 650,
          height: '100%',
          borderCollapse: 'separate !important',
          borderSpacing: 0,
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #CBD6E2',
            borderRight: '1px solid #CBD6E2',
          },
          '& .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        }}
        aria-label='data-mapping-table'
      >
        <TableHead
          sx={{
            '& .MuiTableCell-root': {
              fontWeight: 600,
              fontSize: '13px',
              lineHeight: '21px',
              color: '#2A2A2A',
              padding: '0px',
              px: '8px',
              height: '28px',
              bgcolor: '#FCFCFC',
              borderBottom: '1px solid #CBD6E2 !important',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            },
            '& .MuiTableCell-root:first-of-type': {
              borderTopLeftRadius: '4px',
            },
            '& .MuiTableCell-root:last-child': { borderTopRightRadius: '4px' },
          }}
        >
          <TableRow>
            <TableCell sx={{ width: '30%' }}>Field Label</TableCell>
            <TableCell
              sx={{ width: '20%' }}
              className='flex items-center justify-between'
            >
              <span>Field ID</span>
              <span>
                <Tooltip
                  title={
                    'Click the arrow icon on the right side to open "Original Form", select a field to copy its Field ID, then paste it here to map the field.'
                  }
                  arrow
                  placement='top'
                  slotProps={{ tooltip: { sx: { mr: 1 } } }}
                >
                  <span className='h-[21px] w-5 flex items-center justify-center absolute top-1 right-[4px] cursor-pointer'>
                    <React.Suspense fallback={null}>
                      <ErrorInfoIcon
                        alt='error'
                        className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]'
                      />
                    </React.Suspense>
                  </span>
                </Tooltip>
              </span>
            </TableCell>
            <TableCell sx={{ width: '10%' }}>Field Type</TableCell>
            <TableCell
              sx={{ width: '40%' }}
              className='flex items-center justify-between'
            >
              <span>Source</span>
              <span>
                <Tooltip
                  title={
                    'How to add fields to Source:\n• Type @ to select fields from dropdown (e.g., @Parent.Child)\n• Type # for IDs, then press Enter (e.g., #ID123)\n• Enter numbers directly, then press Enter (e.g., 10, 10.5, 10.5555) - max 4 decimal places\n• Type ( then press Enter to add bracket expression with operators: +, -, *, /, %, <, >, <=, >= (e.g., (#A > #B))\n• Type MIN, MAX or SUM for functions, then press Enter\n• Type IF for conditional expressions (if/else/else if) with MIN/MAX functions and comparison operators, then press Enter\n• Use operators: +, -, *, /, %, <, >, <=, >= between values'
                  }
                  arrow
                  placement='left'
                  slotProps={{
                    tooltip: { sx: { mr: 1, whiteSpace: 'pre-line' } },
                  }}
                >
                  <span className='h-[21px] w-5 flex items-center justify-center absolute top-1 right-[4px] cursor-pointer'>
                    <React.Suspense fallback={null}>
                      <ErrorInfoIcon
                        alt='error'
                        className='w-5 h-3.5 [&>path]:fill-[#9fa0a1]'
                      />
                    </React.Suspense>
                  </span>
                </Tooltip>
              </span>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody
          sx={{
            '& .MuiTableCell-root': {
              fontWeight: 500,
              fontSize: '13px',
              lineHeight: '21px',
              color: '#425A76',
              p: '8px',
              verticalAlign: 'top',
              borderRight: '1px solid #CBD6E2 !important',
              borderBottom: '1px solid #CBD6E2 !important',
            },
            '& .MuiTableRow-root:last-child .MuiTableCell-root': {
              borderBottom: 'none !important',
            },
          }}
        >
          {localMappings.length > 0 &&
            localMappings.map((mapping) => (
              <TableRow key={mapping.rid}>
                {/* Field Label */}
                <TableCell
                  sx={{ p: '8px', maxHeight: '90px', verticalAlign: 'top' }}
                >
                  <TruncateWithTooltip
                    text={mapping.field_label}
                    maxHeight='90px'
                    tooltipMaxWidth='20vw'
                    style={
                      {
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        textOverflow: 'clip',
                      } as React.CSSProperties
                    }
                  />
                </TableCell>

                {/* Field ID */}
                <TableCell sx={{ p: '8px' }}>
                  <div className='flex flex-col gap-1 h-full'>
                    <div
                      className={`flex flex-col relative w-full h-full ${mapping.fieldIdError ? 'bg-[#FEF2F2]' : ''}`}
                    >
                      <textarea
                        value={mapping.field_id || ''}
                        onChange={(e) => {
                          handleFieldIdChange(mapping.rid, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        disabled={formType === 'non-fillable'}
                        placeholder='Enter Field ID'
                        className={`w-full flex-1 min-h-[32px] max-h-[90px] px-2 py-1 ${mapping.status === 'anomaly' && formType !== 'non-fillable' ? 'pb-9' : ''} border rounded-[2px] disabled:bg-gray-100 text-sm outline-none focus:border-2 resize-none overflow-y-auto ${mapping.fieldIdError ? 'border-red-500 bg-[#FEF2F2] focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`}
                      />
                      {mapping.fieldIdError && (
                        <Tooltip
                          title={mapping.fieldIdError}
                          arrow
                          placement='top'
                          slotProps={{
                            tooltip: {
                              sx: { backgroundColor: '#FEF2F2', mr: 1 },
                            },
                          }}
                        >
                          <span className='h-[26px] w-5 flex items-center justify-center absolute top-[1px] bg-[#FEF2F2] right-[4px] cursor-pointer'>
                            <React.Suspense fallback={null}>
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </React.Suspense>
                          </span>
                        </Tooltip>
                      )}
                      {mapping.status === 'anomaly' &&
                        formType !== 'non-fillable' && (
                          <div className='absolute bottom-1 right-1 flex justify-end items-center gap-2 bg-white/95 p-1 rounded'>
                            <button
                              onClick={() => handleAcceptAnomaly(mapping.rid)}
                              className='inline-flex items-center gap-1 p-1.5 rounded text-[11px] w-auto cursor-pointer h-[20px] bg-[#3EA72F1A] hover:bg-[#3da72ff4] hover:text-[#fff] disabled:opacity-60 disabled:cursor-default'
                            >
                              <React.Suspense fallback={null}>
                                <AcceptIcon
                                  alt='accept'
                                  className='w-3.5 h-3.5'
                                />
                              </React.Suspense>
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectAnomaly(mapping.rid)}
                              className='inline-flex items-center gap-1 p-1.5 rounded text-[12px] cursor-pointer w-auto h-[20px] bg-[#FF3C031A] hover:bg-[#FF3C03] hover:text-[#fff] disabled:opacity-60 disabled:cursor-default'
                            >
                              <React.Suspense fallback={null}>
                                <RejectIcon
                                  alt='reject'
                                  className='w-3.5 h-3.5'
                                />
                              </React.Suspense>
                              Reject
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                </TableCell>

                {/* Field Type */}
                <TableCell sx={{ p: '8px' }}>
                  <span className='text-[13px] font-medium text-[#425A76] capitalize'>
                    {mapping.field_type}
                  </span>
                </TableCell>

                {/* Source */}
                <TableCell
                  sx={{ position: 'relative', overflow: 'visible', p: '8px' }}
                >
                  <div className='relative h-full'>
                    <div className='relative w-full h-full'>
                      <div
                        ref={(el) => (containerRefs.current[mapping.rid] = el)}
                        className={`w-full h-full max-h-[90px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text ${
                          mapping.targetError
                            ? 'border-red-500 bg-[#FEF2F2] border-2 pr-8'
                            : functionPopover?.rid === mapping.rid ||
                                conditionalPopover?.rid === mapping.rid ||
                                bracketPopover?.rid === mapping.rid ||
                                sumOfPopover?.rid === mapping.rid
                              ? 'border-blue-400 bg-white border-2'
                              : 'border-gray-300 bg-white focus-within:border-2 focus-within:border-blue-400'
                        }`}
                        onClick={() => {
                          inputRefs.current[mapping.rid]?.focus();
                        }}
                      >
                        {(mapping.fieldExpressions || []).map((item, idx) => (
                          <div key={idx} className='flex items-center'>
                            <ExpressionChip
                              item={item}
                              idx={idx}
                              rid={mapping.rid}
                              getDisplayName={getDisplayName}
                              buildBracketDisplayLabel={
                                buildBracketDisplayLabel
                              }
                              buildConditionalDisplayLabel={
                                buildConditionalDisplayLabel
                              }
                              onDelete={(i) =>
                                item.type === 'operator'
                                  ? removeOperator(mapping.rid, i)
                                  : removeChip(mapping.rid, i)
                              }
                              onFunctionClick={(i) =>
                                handleFunctionChipClick(mapping.rid, i)
                              }
                              onBracketClick={(i) =>
                                handleBracketChipClick(mapping.rid, i)
                              }
                              onConditionalClick={(i) =>
                                handleConditionalChipClick(mapping.rid, i)
                              }
                              onSumOfClick={(i) =>
                                handleSumOfChipClick(mapping.rid, i)
                              }
                            />
                          </div>
                        ))}

                        <input
                          ref={(el) => (inputRefs.current[mapping.rid] = el)}
                          type='text'
                          value={mapping.inputValue || ''}
                          onChange={(e) =>
                            handleInputChange(mapping.rid, e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(mapping.rid, e)}
                          onBlur={() => handleInputBlur(mapping.rid)}
                          placeholder={
                            (mapping.fieldExpressions || []).length === 0
                              ? 'Type @ fields, # for IDs, numbers, ( for Expression, MIN/MAX, SUM, IF or +, -, *, /, %, <, >, <=, >= for operators'
                              : 'Add more...'
                          }
                          className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
                          style={{ minWidth: '80px' }}
                        />
                      </div>

                      {mapping.targetError && (
                        <Tooltip
                          title={mapping.targetError}
                          arrow
                          placement='top'
                          slotProps={{
                            tooltip: {
                              sx: { backgroundColor: '#FEF2F2', mr: 1 },
                            },
                          }}
                        >
                          <span className='h-[24px] w-5 flex items-center justify-center absolute top-[2px] right-[4px] bg-[#FEF2F2] cursor-pointer'>
                            <React.Suspense fallback={null}>
                              <ErrorInfoIcon
                                alt='error'
                                className='w-5 h-3.5'
                              />
                            </React.Suspense>
                          </span>
                        </Tooltip>
                      )}
                    </div>

                    {showAutocomplete[mapping.rid] &&
                      getFilteredOptions(mapping.rid).length > 0 && (
                        <div
                          className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto'
                          style={{ zIndex: 9999, maxHeight: '150px' }}
                        >
                          {getFilteredOptions(mapping.rid).map(
                            (option, idx) => (
                              <div
                                key={idx}
                                className='px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800'
                                onMouseEnter={() =>
                                  setSelectedOptionIndex((prev) => ({
                                    ...prev,
                                    [mapping.rid]: idx,
                                  }))
                                }
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  handleAutocompleteSelect(mapping.rid, option)
                                }
                              >
                                {getDisplayName(option, mapping.rid)}
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </TableCell>
              </TableRow>
            ))}

          {localMappings.length === 0 && (
            <TableRow sx={{ height: '32px' }}>
              <TableCell colSpan={4} align='center'>
                <span>No data available</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </MuiTable>

      {/* ─── Popovers ──────────────────────────────────────────────────────── */}

      {bracketPopover && (
        <BracketPopover
          bracketPopover={bracketPopover}
          setBracketPopover={setBracketPopover}
          conditionalPopover={conditionalPopover}
          setConditionalPopover={setConditionalPopover}
          setLocalMappings={setLocalMappings}
          onMappingsChange={onMappingsChange}
          targetOptions={targetOptions}
          getPopoverFilteredOptions={getPopoverFilteredOptions}
          getPopoverDisplayName={getPopoverDisplayName}
          buildBracketDisplayLabel={buildBracketDisplayLabel}
          buildCalculationConfig={buildCalculationConfig}
          bracketPopoverInputRef={bracketPopoverInputRef}
        />
      )}

      {sumOfPopover && (
        <SumOfPopover
          sumOfPopover={sumOfPopover}
          setSumOfPopover={setSumOfPopover}
          setLocalMappings={setLocalMappings}
          onMappingsChange={onMappingsChange}
          targetOptions={targetOptions}
          getPopoverFilteredOptions={getPopoverFilteredOptions}
          getPopoverDisplayName={getPopoverDisplayName}
          buildCalculationConfig={buildCalculationConfig}
          sumOfPopoverInputRef={sumOfPopoverInputRef}
        />
      )}

      {functionPopover && (
        <FunctionPopover
          functionPopover={functionPopover}
          setFunctionPopover={setFunctionPopover}
          conditionalPopover={conditionalPopover}
          setConditionalPopover={setConditionalPopover}
          setLocalMappings={setLocalMappings}
          onMappingsChange={onMappingsChange}
          targetOptions={targetOptions}
          getPopoverFilteredOptions={getPopoverFilteredOptions}
          getPopoverDisplayName={getPopoverDisplayName}
          buildCalculationConfig={buildCalculationConfig}
          functionPopoverInputRef={functionPopoverInputRef}
        />
      )}

      {conditionalPopover && (
        <ConditionalPopover
          conditionalPopover={conditionalPopover}
          setConditionalPopover={setConditionalPopover}
          setBracketPopover={setBracketPopover}
          setFunctionPopover={setFunctionPopover}
          setLocalMappings={setLocalMappings}
          onMappingsChange={onMappingsChange}
          targetOptions={targetOptions}
          getPopoverFilteredOptions={getPopoverFilteredOptions}
          getPopoverDisplayName={getPopoverDisplayName}
          buildBracketDisplayLabel={buildBracketDisplayLabel}
          buildCalculationConfig={buildCalculationConfig}
          clauseInputRefs={clauseInputRefs}
          clauseContainerRefs={clauseContainerRefs}
          returnInputRefs={returnInputRefs}
          returnContainerRefs={returnContainerRefs}
        />
      )}
    </TableContainer>
  );
};

export default MappingTable;
