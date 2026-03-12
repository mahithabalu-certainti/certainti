import React, { useState, useEffect, useRef } from 'react';
import {
  Table as MuiTable,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Popover,
  IconButton,
} from '@mui/material';
import {
  AcceptIcon,
  CloseIcon,
  ErrorInfoIcon,
  RejectIcon,
} from '../../../../assets';
import TruncateWithTooltip from '../../../../components/truncate-with-tooltip/truncate-with-tooltip';
import TextButton from '../../../../components/button/text-button';

interface ObjectItem {
  rid: string;
  parent_object: string;
  object_name: string;
  ref_table: string;
  field_name: string | null;
  field_type: 'line-item' | 'table-item' | string;
}

interface ConditionalClause {
  type: 'IF' | 'ELSE_IF' | 'ELSE';
  condition?: string;
  expressions?: FieldExpression[]; // Store chips for this clause
  inputValue?: string; // Store text input for this clause
  showAutocomplete?: boolean;
  autocompleteIndex?: number;
  result: string;
  error?: string; // Individual error message
  // Return field support
  returnExpressions?: FieldExpression[]; // Store chips for return field
  returnInputValue?: string; // Store text input for return field
  returnShowAutocomplete?: boolean;
  returnAutocompleteIndex?: number;
  returnError?: string; // Individual return field error message
}

interface ConditionalExpression {
  clauses: ConditionalClause[];
}
interface BracketItem {
  type: 'chip' | 'operator' | 'manual' | 'number' | 'bracket';
  value: string;
  nestedItems?: BracketItem[]; // for nested bracket sub-expressions
}

interface FieldExpression {
  type:
    | 'chip'
    | 'operator'
    | 'manual'
    | 'function'
    | 'number'
    | 'conditional'
    | 'bracket'
    | 'sumOf';
  value: string;
  functionType?: 'MIN' | 'MAX';
  functionArgs?: string[]; // Array of arguments (object RIDs or manual values)
  conditionalData?: ConditionalExpression;
  bracketItems?: BracketItem[]; // Inner items for bracket expressions
  sumOfArg?: { type: 'chip' | 'manual'; value: string }; // Argument for sum() - either @field or #manual
}

interface ObjectRidMap {
  [key: number]: string | number;
}

interface MappingItem {
  rid: string;
  field_label: string;
  field_id: string | null;
  calculation_config: ObjectRidMap | null;
  field_type: 'line-item' | 'table-item' | string;
  fieldExpressions?: FieldExpression[];
  inputValue?: string;
  fieldIdError?: string;
  targetError?: string;
  status?: string;
}

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

  // Function popover state
  const [functionPopover, setFunctionPopover] = useState<{
    rid: string;
    type: 'MIN' | 'MAX';
    args: FieldExpression[]; // Store as expressions (chip or manual)
    inputValue: string;
    anchorEl: HTMLElement | null;
    editingIndex?: number; // If editing existing function
    error?: string; // Error message for validation
  } | null>(null);

  const functionPopoverInputRef = useRef<HTMLInputElement | null>(null);
  const clauseInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const clauseContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const returnInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const returnContainerRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const bracketPopoverInputRef = useRef<HTMLInputElement | null>(null);

  // Conditional popover state
  const [conditionalPopover, setConditionalPopover] = useState<{
    rid: string;
    clauses: ConditionalClause[];
    anchorEl: HTMLElement | null;
    editingIndex?: number;
    error?: string;
  } | null>(null);

  // Bracket popover state
  const [bracketPopover, setBracketPopover] = useState<{
    rid: string;
    items: BracketItem[];
    inputValue: string;
    anchorEl: HTMLElement | null;
    editingIndex?: number;
    error?: string;
    showAutocomplete?: boolean;
    autocompleteIndex?: number;
    nestedMode?: boolean; // whether we are currently building a nested bracket
    nestedItems?: BracketItem[]; // items collected for the nested bracket in progress
    // Source tracking: where the bracket popover was opened from
    source?: 'main' | 'clause-condition' | 'clause-return';
    clauseIndex?: number; // which clause (for clause-condition or clause-return)
    clauseChipEditIndex?: number; // if editing an existing bracket chip inside a clause
  } | null>(null);

  // SumOf popover state
  const [sumOfPopover, setSumOfPopover] = useState<{
    rid: string;
    inputValue: string;
    anchorEl: HTMLElement | null;
    editingIndex?: number;
    error?: string;
    showAutocomplete?: boolean;
    autocompleteIndex?: number;
    selectedArg?: { type: 'chip' | 'manual'; value: string }; // The selected argument
  } | null>(null);
  const sumOfPopoverInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mappings && mappings.length > 0) {
      if (localMappings.length === 0) {
        // INITIALIZATION (First Load)
        // Initialize mappings with fieldExpressions from calculation_config if not present
        const initializedMappings = mappings.map((mapping) => {
          let fieldExpressions = mapping.fieldExpressions || [];

          // If we have calculation_config but no fieldExpressions, convert calculation_config to fieldExpressions
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
                  // Even keys are operators
                  const operatorMap: Record<string, string> = {
                    add: '+',
                    subtract: '-',
                    multiply: '*',
                    divide: '/',
                  };
                  return {
                    type: 'operator' as const,
                    value: operatorMap[value] || value,
                  };
                } else {
                  // Check if this is a bracket expression like (#FieldID1 - #FieldID2)
                  if (
                    typeof value === 'string' &&
                    value.startsWith('(') &&
                    value.endsWith(')')
                  ) {
                    const innerStr = value.slice(1, -1).trim();
                    // Parse inner items for refill
                    // Bracket-aware tokenizer: respects nested (...) groups
                    const tokenizeBracketStr = (s: string): string[] => {
                      const toks: string[] = [];
                      let i = 0;
                      let cur = '';
                      while (i < s.length) {
                        const ch = s[i];
                        if (ch === '(') {
                          // Collect balanced nested bracket as one token
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
                          toks.push(s.slice(i, j)); // includes outer ( )
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

                    // Recursively parse tokens into BracketItems
                    const parseBracketTokens = (
                      tokens: string[]
                    ): BracketItem[] => {
                      const result: BracketItem[] = [];
                      const mathOpsList = ['+', '-', '*', '/', '%'];
                      for (const tok of tokens) {
                        if (!tok) continue;
                        if (mathOpsList.includes(tok)) {
                          result.push({ type: 'operator', value: tok });
                        } else if (tok.startsWith('(') && tok.endsWith(')')) {
                          // Nested bracket
                          const nestedInner = tok.slice(1, -1).trim();
                          const nestedTokens = tokenizeBracketStr(nestedInner);
                          const nestedItems = parseBracketTokens(nestedTokens);
                          result.push({
                            type: 'bracket',
                            value: tok,
                            nestedItems,
                          });
                        } else if (tok.startsWith('#')) {
                          result.push({ type: 'manual', value: tok });
                        } else {
                          // RID lookup
                          const objByRid = objectsList.find(
                            (obj) => obj.rid === tok
                          );
                          if (objByRid) {
                            result.push({
                              type: 'chip',
                              value: `${objByRid.parent_object}.${objByRid.object_name}`,
                            });
                          } else {
                            // Parent.Child format
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

                    const parsedItems = parseBracketTokens(
                      tokenizeBracketStr(innerStr)
                    );
                    return {
                      type: 'bracket' as const,
                      value,
                      bracketItems: parsedItems,
                    };
                  }

                  // Check if this is a MIN or MAX function
                  if (
                    typeof value === 'string' &&
                    (value.startsWith('MIN(') || value.startsWith('MAX('))
                  ) {
                    const functionType = value.startsWith('MIN(')
                      ? 'MIN'
                      : 'MAX';
                    // Extract arguments from MIN(...) or MAX(...)
                    const argsMatch = value.match(/^(MIN|MAX)\((.*)\)$/);
                    if (argsMatch && argsMatch[2]) {
                      const argsString = argsMatch[2];
                      const args = argsString
                        .split(',')
                        .map((arg) => arg.trim());

                      // Convert args to display format
                      const displayArgs = args.map((arg) => {
                        if (arg.startsWith('#')) {
                          return arg; // Manual entry
                        } else {
                          // Object RID - find the corresponding parent.child
                          const objectItem = objectsList.find(
                            (obj) => obj.rid === arg
                          );
                          if (objectItem) {
                            return `@${objectItem.parent_object}.${objectItem.object_name}`;
                          }
                          return arg;
                        }
                      });

                      return {
                        type: 'function' as const,
                        value: `${functionType}(${displayArgs.join(', ')})`,
                        functionType: functionType as 'MIN' | 'MAX',
                        functionArgs: args,
                      };
                    }
                  }

                  // Check if this is a manual entry (starts with #)
                  if (typeof value === 'string' && value.startsWith('#')) {
                    return {
                      type: 'manual' as const,
                      value: value,
                    };
                  }

                  // Check if this is a number entry (numeric value or number type)
                  if (typeof value === 'number') {
                    return {
                      type: 'number' as const,
                      value: value.toString(),
                    };
                  }

                  if (typeof value === 'string') {
                    const numberRegex = /^-?\d+(\.\d+)?$/;
                    if (numberRegex.test(value)) {
                      return {
                        type: 'number' as const,
                        value: value,
                      };
                    }
                  }

                  // Check if this is a sum expression like SUM(rid) or sum(rid)
                  if (
                    typeof value === 'string' &&
                    value.toUpperCase().startsWith('SUM(') &&
                    value.endsWith(')')
                  ) {
                    const innerArg = value.slice(4, -1).trim(); // Extract content inside sum(...)
                    let sumOfArg: { type: 'chip' | 'manual'; value: string };

                    if (innerArg.startsWith('#')) {
                      sumOfArg = { type: 'manual', value: innerArg };
                    } else {
                      // RID lookup
                      const objectItem = objectsList.find(
                        (obj) => obj.rid === innerArg
                      );
                      if (objectItem) {
                        sumOfArg = {
                          type: 'chip',
                          value: `${objectItem.parent_object}.${objectItem.object_name}`,
                        };
                      } else {
                        sumOfArg = { type: 'manual', value: innerArg };
                      }
                    }

                    return {
                      type: 'sumOf' as const,
                      value: value,
                      sumOfArg,
                    };
                  }

                  // Check if this is a conditional expression
                  if (typeof value === 'string' && value.startsWith('IF(')) {
                    // Check if we already have fieldExpressions with conditionalData
                    const existingConditional = mapping.fieldExpressions?.find(
                      (exp) => exp.type === 'conditional' && exp.conditionalData
                    );

                    if (existingConditional?.conditionalData) {
                      // Use existing structured data instead of re-parsing
                      return existingConditional;
                    }

                    // Only parse if we don't have structured data (first-time load from backend)
                    const parseConditionalString = (
                      str: string
                    ): ConditionalClause[] => {
                      const clauses: ConditionalClause[] = [];

                      // Tokenizer that preserves #... manual values with spaces AND balanced bracket groups
                      const tokenize = (input: string): string[] => {
                        const tokens: string[] = [];
                        let current = '';
                        let inManualValue = false;

                        for (let i = 0; i < input.length; i++) {
                          const char = input[i];

                          // Handle balanced bracket groups — collect (…) as a single token
                          if (char === '(' && !inManualValue) {
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
                            tokens.push(input.slice(i, j)); // includes outer ( )
                            i = j - 1; // -1 because the for-loop does i++
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
                            // Also check if next token starts a bracket group
                            const isBracket = nextToken.startsWith('(');

                            if (isOperator || isRid || isBracket) {
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
                        if (current.trim()) {
                          tokens.push(current.trim());
                        }
                        return tokens;
                      };

                      // Bracket-aware tokenizer for inner bracket content
                      const tokenizeBracketStrForConditional = (
                        s: string
                      ): string[] => {
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

                      // Recursively parse bracket tokens into BracketItems
                      const parseBracketTokensForConditional = (
                        bTokens: string[]
                      ): BracketItem[] => {
                        const result: BracketItem[] = [];
                        const mathOpsList = ['+', '-', '*', '/', '%'];
                        for (const tok of bTokens) {
                          if (!tok) continue;
                          if (mathOpsList.includes(tok)) {
                            result.push({ type: 'operator', value: tok });
                          } else if (tok.startsWith('(') && tok.endsWith(')')) {
                            const nestedInner = tok.slice(1, -1).trim();
                            const nestedTokens =
                              tokenizeBracketStrForConditional(nestedInner);
                            const nestedItems =
                              parseBracketTokensForConditional(nestedTokens);
                            result.push({
                              type: 'bracket',
                              value: tok,
                              nestedItems,
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
                        const parts = tokenize(input);
                        return parts
                          .map((part) => {
                            if (!part) return null;

                            // Check if this is a bracket expression (starts with '(' and ends with ')')
                            if (part.startsWith('(') && part.endsWith(')')) {
                              const innerStr = part.slice(1, -1).trim();
                              const bracketTokens =
                                tokenizeBracketStrForConditional(innerStr);
                              const bracketItems =
                                parseBracketTokensForConditional(bracketTokens);
                              return {
                                type: 'bracket' as const,
                                value: part,
                                bracketItems,
                              };
                            }

                            const objectItem = objectsList.find(
                              (obj) => obj.rid === part
                            );
                            if (objectItem) {
                              return {
                                type: 'chip' as const,
                                value: `${objectItem.parent_object}.${objectItem.object_name}`,
                              };
                            }
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
                            if (isOperator) {
                              return { type: 'operator' as const, value: part };
                            }
                            if (!isNaN(Number(part)) && part.trim() !== '') {
                              return { type: 'number' as const, value: part };
                            }
                            return { type: 'manual' as const, value: part };
                          })
                          .filter(Boolean) as FieldExpression[];
                      };

                      // Try new format: IF(...) { THEN ... } or IF(...) { RETURN ... }
                      // Use bracket-aware parser instead of regex to handle nested parentheses
                      let hasNewFormat = false;
                      let parsePos = 0;

                      const parseNewFormat = (str: string) => {
                        while (parsePos < str.length) {
                          // Skip whitespace
                          while (parsePos < str.length && str[parsePos] === ' ')
                            parsePos++;
                          if (parsePos >= str.length) break;

                          // Try to match IF, ELSE IF, or ELSE
                          let clauseType: 'IF' | 'ELSE_IF' | 'ELSE' | null =
                            null;
                          if (str.substring(parsePos).startsWith('ELSE IF')) {
                            clauseType = 'ELSE_IF';
                            parsePos += 7; // skip 'ELSE IF'
                          } else if (
                            str.substring(parsePos).startsWith('ELSE')
                          ) {
                            clauseType = 'ELSE';
                            parsePos += 4; // skip 'ELSE'
                          } else if (str.substring(parsePos).startsWith('IF')) {
                            clauseType = 'IF';
                            parsePos += 2; // skip 'IF'
                          } else {
                            parsePos++;
                            continue;
                          }

                          // Skip whitespace
                          while (parsePos < str.length && str[parsePos] === ' ')
                            parsePos++;

                          // Extract condition (balanced parentheses) for IF and ELSE_IF
                          let conditionContent = '';
                          if (
                            clauseType !== 'ELSE' &&
                            parsePos < str.length &&
                            str[parsePos] === '('
                          ) {
                            parsePos++; // skip opening '('
                            let depth = 1;
                            const condStart = parsePos;
                            while (parsePos < str.length && depth > 0) {
                              if (str[parsePos] === '(') depth++;
                              if (str[parsePos] === ')') depth--;
                              if (depth > 0) parsePos++;
                            }
                            conditionContent = str
                              .substring(condStart, parsePos)
                              .trim();
                            parsePos++; // skip closing ')'
                          }

                          // Skip whitespace
                          while (parsePos < str.length && str[parsePos] === ' ')
                            parsePos++;

                          // Expect '{'
                          if (parsePos < str.length && str[parsePos] === '{') {
                            parsePos++; // skip '{'
                          }

                          // Skip whitespace
                          while (parsePos < str.length && str[parsePos] === ' ')
                            parsePos++;

                          // Skip THEN or RETURN keyword
                          if (str.substring(parsePos).startsWith('THEN')) {
                            parsePos += 4;
                          } else if (
                            str.substring(parsePos).startsWith('RETURN')
                          ) {
                            parsePos += 6;
                          }

                          // Skip whitespace
                          while (parsePos < str.length && str[parsePos] === ' ')
                            parsePos++;

                          // Extract return content until '}'
                          // Need to handle balanced braces in case content has them
                          let returnContent = '';
                          let braceDepth = 1;
                          const retStart = parsePos;
                          while (parsePos < str.length && braceDepth > 0) {
                            if (str[parsePos] === '{') braceDepth++;
                            if (str[parsePos] === '}') {
                              braceDepth--;
                              if (braceDepth === 0) break;
                            }
                            parsePos++;
                          }
                          returnContent = str
                            .substring(retStart, parsePos)
                            .trim();
                          if (parsePos < str.length) parsePos++; // skip closing '}'

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

                      // Fallback to old format: IF(cond, res)
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

                    const clauses = parseConditionalString(value);

                    if (clauses.length > 0) {
                      return {
                        type: 'conditional' as const,
                        value: value,
                        conditionalData: { clauses },
                      };
                    }
                  }

                  // Odd keys are object IDs - find the corresponding parent.child
                  const objectItem = objectsList.find(
                    (obj) => obj.rid === value
                  );
                  if (objectItem) {
                    return {
                      type: 'chip' as const,
                      value: `${objectItem.parent_object}.${objectItem.object_name}`,
                    };
                  }
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
        onMappingsChange(initializedMappings); // Notify parent with fieldExpressions
      } else {
        // UPDATE (Sync Errors)
        // If localMappings exists, sync ONLY the errors from incoming mappings prop
        setLocalMappings((prev) =>
          prev.map((localMap) => {
            const propMap = mappings.find((m) => m.rid === localMap.rid);
            if (propMap) {
              // Only update if errors have changed
              if (
                localMap.fieldIdError !== propMap.fieldIdError ||
                localMap.targetError !== propMap.targetError
              ) {
                return {
                  ...localMap,
                  fieldIdError: propMap.fieldIdError,
                  targetError: propMap.targetError,
                };
              }
            }
            return localMap;
          })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mappings, objectsList, localMappings.length]);

  // Monitor input value changes to update autocomplete
  useEffect(() => {
    localMappings.forEach((mapping) => {
      const inputValue = mapping.inputValue || '';
      const atIndex = inputValue.lastIndexOf('@');

      if (atIndex !== -1) {
        const afterAt = inputValue.substring(atIndex + 1);
        // If we have a dot (parent selected), ensure autocomplete shows children
        if (afterAt.includes('.')) {
          setShowAutocomplete((prev) => ({ ...prev, [mapping.rid]: true }));
        }
      }
    });
  }, [localMappings]);

  // Build hierarchical target options from objectsList
  const targetOptions = React.useMemo(() => {
    const options: Record<string, Record<string, string>> = {};

    if (!Array.isArray(objectsList)) {
      return options;
    }

    objectsList.forEach((item) => {
      if (!options[item.parent_object]) {
        options[item.parent_object] = {};
      }
      options[item.parent_object][item.object_name] = item.rid;
    });

    return options;
  }, [objectsList]);

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
          const funcStr = `${exp.functionType}(${exp.functionArgs.join(', ')})`;
          objectRidMap[currentIndex] = funcStr;
          currentIndex += 2;
        }
      } else if (exp.type === 'bracket') {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'conditional') {
        objectRidMap[currentIndex] = exp.value;
        currentIndex += 2;
      } else if (exp.type === 'sumOf') {
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

  const handleFieldIdChange = (rid: string, value: string): void => {
    const updatedMappings = localMappings.map((mapping) => {
      if (mapping.rid === rid) {
        let newStatus = mapping.status;
        if (!value || value.trim() === '') {
          // If field_id is empty, always set status to 'rejected'
          newStatus = 'rejected';
        } else if (mapping.status !== 'anomaly') {
          // If field_id has value and not in anomaly state, set to 'accepted'
          newStatus = 'accepted';
        }
        // If status is 'anomaly', it stays as 'anomaly' until accepted/rejected

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
    const updatedMappings = localMappings.map((mapping) => {
      if (mapping.rid === rid) {
        return {
          ...mapping,
          status: 'accepted',
          fieldIdError: undefined,
        };
      }
      return mapping;
    });
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

  const handleRejectAnomaly = (rid: string): void => {
    const updatedMappings = localMappings.map((mapping) => {
      if (mapping.rid === rid) {
        return {
          ...mapping,
          field_id: '', // Clear field ID on reject
          status: 'rejected',
          fieldIdError: undefined,
        };
      }
      return mapping;
    });
    setLocalMappings(updatedMappings);
    onMappingsChange(updatedMappings);
  };

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

            // Rebuild ObjectRidMap from expressions
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
      prev.map((mapping) => {
        if (mapping.rid === rid) {
          return { ...mapping, inputValue: value, targetError: undefined };
        }
        return mapping;
      })
    );

    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1 && atIndex >= 0;
    setShowAutocomplete((prev) => ({ ...prev, [rid]: shouldShow }));
    setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));

    // Update parent component
    const updated = localMappings.map((m) =>
      m.rid === rid ? { ...m, inputValue: value, targetError: undefined } : m
    );
    onMappingsChange(updated);
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

    if (atIndex !== -1) {
      // Check if selectedValue contains a dot (parent.child format)
      // If it has a dot, it's a complete selection; if not, it's just a parent
      const isCompleteProperty = selectedValue.includes('.');

      if (!isCompleteProperty) {
        // User selected a parent, add dot and show children
        const newInputValue =
          currentInput.substring(0, atIndex + 1) + selectedValue + '.';

        // Update the mapping with new input value
        const updatedMappings = localMappings.map((m) => {
          if (m.rid === rid) {
            return {
              ...m,
              inputValue: newInputValue,
            };
          }
          return m;
        });

        setLocalMappings(updatedMappings);

        // Ensure autocomplete stays open
        setShowAutocomplete((prev) => ({ ...prev, [rid]: true }));
        setSelectedOptionIndex((prev) => ({ ...prev, [rid]: 0 }));

        return;
      }

      // Complete selection - add as chip (normal mode)
      const beforeAt = currentInput.substring(0, atIndex).trim();
      setLocalMappings((prev) => {
        const updated = prev.map((m) => {
          if (m.rid === rid) {
            const newExpressions = [...(m.fieldExpressions || [])];

            if (beforeAt && ['+', '-', '*', '/'].includes(beforeAt)) {
              newExpressions.push({
                type: 'operator' as const,
                value: beforeAt,
              });
            }

            newExpressions.push({
              type: 'chip' as const,
              value: selectedValue,
            });

            // Build ObjectRidMap from expressions
            return {
              ...m,
              fieldExpressions: newExpressions,
              inputValue: '',
              calculation_config: buildCalculationConfig(newExpressions),
              targetError: undefined, // Clear targetError when user makes changes
            };
          }
          return m;
        });
        onMappingsChange(updated);
        return updated;
      });
    }

    setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
  };

  const removeChip = (rid: string, indexToRemove: number): void => {
    setLocalMappings((prev) => {
      const updated = prev.map((mapping) => {
        if (mapping.rid === rid) {
          const newExpressions = (mapping.fieldExpressions || []).filter(
            (_, index) => index !== indexToRemove
          );

          // Rebuild ObjectRidMap from remaining expressions
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined, // Clear targetError when user makes changes
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

          // Rebuild ObjectRidMap from remaining expressions
          return {
            ...mapping,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined, // Clear targetError when user makes changes
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

    // Check if user typed MIN or MAX and pressed Enter
    if (event.key === 'Enter') {
      const functionInput = currentInput.trim().toUpperCase();

      // Check if user typed '(' and pressed Enter -> open bracket popover
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

        // Open function popover
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setFunctionPopover({
            rid,
            type: functionInput as 'MIN' | 'MAX',
            args: [],
            inputValue: '',
            anchorEl: containerElement,
          });

          // Don't clear the main input - keep MIN/MAX visible
        }
        return;
      }

      // Check if user typed SUM and pressed Enter -> open sumOf popover
      if (functionInput === 'SUM' || functionInput === 'SUM(') {
        event.preventDefault();
        const containerElement = containerRefs.current[rid];
        if (containerElement) {
          setSumOfPopover({
            rid,
            inputValue: '',
            anchorEl: containerElement,
          });
          setLocalMappings((prev) =>
            prev.map((m) => (m.rid === rid ? { ...m, inputValue: '' } : m))
          );
        }
        return;
      }

      // Check if user typed IF and pressed Enter
      if (functionInput === 'IF') {
        event.preventDefault();

        // Open conditional popover
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

      // Handle manual entry mode (when input starts with # and NOT in popover)
      if (currentInput.trim().startsWith('#')) {
        event.preventDefault();
        const manualValue = currentInput.trim();

        if (manualValue.length > 1) {
          // Must have content after #
          setLocalMappings((prev) => {
            const updated = prev.map((m) => {
              if (m.rid === rid) {
                const newExpressions = [...(m.fieldExpressions || [])];

                newExpressions.push({
                  type: 'manual' as const,
                  value: manualValue,
                });

                // Build ObjectRidMap from expressions
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

      // Handle number entry (when input is a valid number)
      const numberInput = currentInput.trim();
      // Regex: optional minus, digits, optional decimal with any number of places
      const numberRegex = /^-?\d+(\.\d+)?$/;

      if (numberRegex.test(numberInput)) {
        event.preventDefault();
        const numberValue = numberInput;

        setLocalMappings((prev) => {
          const updated = prev.map((m) => {
            if (m.rid === rid) {
              const newExpressions = [...(m.fieldExpressions || [])];

              newExpressions.push({
                type: 'number' as const,
                value: numberValue,
              });

              // Build ObjectRidMap from expressions
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
        if (options[currentIndex]) {
          handleAutocompleteSelect(rid, options[currentIndex]);
        }
        break;
      case 'Escape': {
        const mapping = localMappings.find((m) => m.rid === rid);
        if (mapping) {
          const currentInput = mapping.inputValue || '';
          const atIndex = currentInput.lastIndexOf('@');

          if (atIndex !== -1) {
            const afterAt = currentInput.substring(atIndex + 1);
            const dotCount = (afterAt.match(/\./g) || []).length;

            if (afterAt && (dotCount < 1 || afterAt.endsWith('.'))) {
              setLocalMappings((prev) =>
                prev.map((m) => {
                  if (m.rid === rid) {
                    return { ...m, inputValue: '' };
                  }
                  return m;
                })
              );
            }
          }
        }

        setShowAutocomplete((prev) => ({ ...prev, [rid]: false }));
        break;
      }
    }
  };

  // Function popover handlers
  const handleFunctionPopoverInputChange = (value: string): void => {
    if (!functionPopover) return;

    setFunctionPopover({
      ...functionPopover,
      inputValue: value,
      error: undefined, // Clear error when user types
    });
  };

  const handleFunctionPopoverAutocompleteSelect = (
    selectedValue: string
  ): void => {
    if (!functionPopover) return;

    const isCompleteProperty = selectedValue.includes('.');

    if (!isCompleteProperty) {
      // User selected a parent, add dot
      const atIndex = functionPopover.inputValue.lastIndexOf('@');
      if (atIndex !== -1) {
        const newInputValue =
          functionPopover.inputValue.substring(0, atIndex + 1) +
          selectedValue +
          '.';
        setFunctionPopover({
          ...functionPopover,
          inputValue: newInputValue,
        });
      }
      return;
    }

    // Complete selection - add as chip
    const [parent, child] = selectedValue.split('.', 2);
    const objectId = targetOptions[parent]?.[child] || '';

    if (objectId) {
      setFunctionPopover({
        ...functionPopover,
        args: [
          ...functionPopover.args,
          { type: 'chip' as const, value: selectedValue },
        ],
        inputValue: '',
        error: undefined, // Clear error when adding chip
      });
    }
  };

  const handleFunctionPopoverKeyDown = (event: React.KeyboardEvent): void => {
    if (!functionPopover) return;

    const currentInput = functionPopover.inputValue;

    // Handle manual entry
    if (event.key === 'Enter' && currentInput.trim().startsWith('#')) {
      event.preventDefault();
      const manualValue = currentInput.trim();

      if (manualValue.length > 1) {
        setFunctionPopover({
          ...functionPopover,
          args: [
            ...functionPopover.args,
            { type: 'manual' as const, value: manualValue },
          ],
          inputValue: '',
          error: undefined, // Clear error when adding manual entry
        });
      }
      return;
    }

    // Handle autocomplete navigation
    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const searchText = currentInput.substring(atIndex + 1);
    const options = getPopoverFilteredOptions(searchText);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Handle arrow down for autocomplete
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Handle arrow up for autocomplete
        break;
      case 'Enter':
        event.preventDefault();
        if (options.length > 0) {
          handleFunctionPopoverAutocompleteSelect(options[0]);
        }
        break;
    }
  };

  const getPopoverFilteredOptions = (searchText: string): string[] => {
    const rid =
      functionPopover?.rid ||
      conditionalPopover?.rid ||
      bracketPopover?.rid ||
      sumOfPopover?.rid;
    if (!rid) return [];

    // Reuse main getFilteredOptions function with custom search text
    return getFilteredOptions(rid, searchText);
  };

  const getPopoverDisplayName = (option: string): string => {
    const rid =
      functionPopover?.rid ||
      conditionalPopover?.rid ||
      bracketPopover?.rid ||
      sumOfPopover?.rid;
    if (!rid) return option;

    // Reuse main getDisplayName function
    return getDisplayName(option, rid);
  };

  // Builds a human-readable display string from BracketItem[], used for chip labels in the main table
  const buildBracketDisplayLabel = (
    items: BracketItem[],
    rid: string
  ): string => {
    if (!items || items.length === 0) return '(...)';
    const parts = items.map((it) => {
      if (it.type === 'chip') {
        // Show the object's display label, not the RID
        return getDisplayName(it.value, rid);
      } else if (it.type === 'bracket' && it.nestedItems) {
        return `(${buildBracketDisplayLabel(it.nestedItems, rid)})`;
      }
      return it.value; // manual (keeps #), operator, number
    });
    return parts.join(' ');
  };

  // Builds a human-readable display string for a single FieldExpression (used inside conditional display)
  const buildExpressionDisplayLabel = (
    expressions: FieldExpression[],
    rid: string
  ): string => {
    if (!expressions || expressions.length === 0) return '';
    return expressions
      .map((exp) => {
        if (exp.type === 'chip') {
          return getDisplayName(exp.value, rid);
        } else if (exp.type === 'bracket') {
          return `(${buildBracketDisplayLabel(exp.bracketItems || [], rid)})`;
        } else if (exp.type === 'operator') {
          return exp.value;
        }
        return exp.value; // manual, number
      })
      .join(' ');
  };

  // Builds a human-readable display label for the conditional chip in the main source field
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
        if (clause.type === 'IF') {
          return `IF(${condStr}) { THEN ${retStr} }`;
        } else if (clause.type === 'ELSE_IF') {
          return `ELSE IF(${condStr}) { THEN ${retStr} }`;
        } else {
          return `ELSE { THEN ${retStr} }`;
        }
      })
      .join(' ');
  };

  // ==================== BRACKET POPOVER HANDLERS ====================

  const handleBracketPopoverInputChange = (value: string): void => {
    if (!bracketPopover) return;

    const mathOps = ['+', '-', '*', '/', '%'];

    // Auto-add operator immediately when user types a single operator character
    if (mathOps.includes(value)) {
      const targetList = bracketPopover.nestedMode
        ? bracketPopover.nestedItems || []
        : bracketPopover.items;
      const newItem: BracketItem = { type: 'operator', value };
      if (bracketPopover.nestedMode) {
        setBracketPopover({
          ...bracketPopover,
          nestedItems: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      } else {
        setBracketPopover({
          ...bracketPopover,
          items: [...targetList, newItem],
          inputValue: '',
          error: undefined,
        });
      }
      return;
    }

    // Typing '(' → enter nested bracket mode
    if (value === '(' && !bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        inputValue: '',
        nestedMode: true,
        nestedItems: [],
        error: undefined,
        showAutocomplete: false,
      });
      return;
    }

    // Typing ')' → close nested bracket mode
    if (value === ')' && bracketPopover.nestedMode) {
      const nestedItems = bracketPopover.nestedItems || [];
      // Validate: nested sub-expression must have at least one operator
      const hasOp = nestedItems.some((it) => it.type === 'operator');
      if (nestedItems.length === 0 || !hasOp) {
        setBracketPopover({
          ...bracketPopover,
          inputValue: '',
          error:
            'Nested bracket must contain at least one operation (e.g., (#A * @B))',
        });
        return;
      }
      // Build nested bracket string
      const nestedStr = nestedItems
        .map((it) => {
          if (it.type === 'chip') return `@${it.value}`;
          if (it.type === 'bracket') return it.value;
          return it.value;
        })
        .join(' ');
      const nestedValue = `(${nestedStr})`;
      const nestedBracketItem: BracketItem = {
        type: 'bracket',
        value: nestedValue,
        nestedItems,
      };
      setBracketPopover({
        ...bracketPopover,
        items: [...bracketPopover.items, nestedBracketItem],
        inputValue: '',
        nestedMode: false,
        nestedItems: [],
        error: undefined,
        showAutocomplete: false,
      });
      return;
    }

    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1;
    setBracketPopover({
      ...bracketPopover,
      inputValue: value,
      error: undefined,
      showAutocomplete: shouldShow,
      autocompleteIndex: shouldShow ? 0 : bracketPopover.autocompleteIndex,
    });
  };

  const handleBracketPopoverAutocompleteSelect = (
    selectedValue: string
  ): void => {
    if (!bracketPopover) return;
    const isCompleteProperty = selectedValue.includes('.');
    if (!isCompleteProperty) {
      const atIndex = bracketPopover.inputValue.lastIndexOf('@');
      if (atIndex !== -1) {
        const newInputValue =
          bracketPopover.inputValue.substring(0, atIndex + 1) +
          selectedValue +
          '.';
        setBracketPopover({
          ...bracketPopover,
          inputValue: newInputValue,
          showAutocomplete: true,
          autocompleteIndex: 0,
        });
      }
      return;
    }
    // Complete selection - add as chip to either nestedItems or main items
    const chipItem: BracketItem = { type: 'chip', value: selectedValue };
    if (bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        nestedItems: [...(bracketPopover.nestedItems || []), chipItem],
        inputValue: '',
        showAutocomplete: false,
        error: undefined,
      });
    } else {
      setBracketPopover({
        ...bracketPopover,
        items: [...bracketPopover.items, chipItem],
        inputValue: '',
        showAutocomplete: false,
        error: undefined,
      });
    }
  };

  const handleBracketPopoverKeyDown = (event: React.KeyboardEvent): void => {
    if (!bracketPopover) return;
    const currentInput = bracketPopover.inputValue;

    if (event.key === 'Enter') {
      event.preventDefault();

      // Autocomplete selection
      if (bracketPopover.showAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        const selected = options[bracketPopover.autocompleteIndex || 0];
        if (selected) {
          handleBracketPopoverAutocompleteSelect(selected);
          return;
        }
      }

      // Manual entry (#) — goes to nested or main list
      if (
        currentInput.trim().startsWith('#') &&
        currentInput.trim().length > 1
      ) {
        const manualItem: BracketItem = {
          type: 'manual',
          value: currentInput.trim(),
        };
        if (bracketPopover.nestedMode) {
          setBracketPopover({
            ...bracketPopover,
            nestedItems: [...(bracketPopover.nestedItems || []), manualItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        } else {
          setBracketPopover({
            ...bracketPopover,
            items: [...bracketPopover.items, manualItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        }
        return;
      }

      // Number entry — validate max 4 decimal places, then goes to nested or main list
      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(currentInput.trim())) {
        const numberInput = currentInput.trim();
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          setBracketPopover({
            ...bracketPopover,
            error: 'Maximum of 4 decimal places allowed for numbers',
          });
          return;
        }
        const numItem: BracketItem = {
          type: 'number',
          value: numberInput,
        };
        if (bracketPopover.nestedMode) {
          setBracketPopover({
            ...bracketPopover,
            nestedItems: [...(bracketPopover.nestedItems || []), numItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        } else {
          setBracketPopover({
            ...bracketPopover,
            items: [...bracketPopover.items, numItem],
            inputValue: '',
            showAutocomplete: false,
            error: undefined,
          });
        }
        return;
      }

      // Invalid input
      if (currentInput.trim()) {
        setBracketPopover({
          ...bracketPopover,
          error: `Invalid input "${currentInput.trim()}". Use @ for fields, # for manual IDs, or numbers. Operators (+,-,*,/,%) are auto-added when typed.`,
        });
      }
      return;
    }

    // Escape key: if in nested mode, cancel it; else close autocomplete
    if (event.key === 'Escape') {
      if (bracketPopover.nestedMode) {
        setBracketPopover({
          ...bracketPopover,
          nestedMode: false,
          nestedItems: [],
          inputValue: '',
          showAutocomplete: false,
        });
        return;
      }
      setBracketPopover({ ...bracketPopover, showAutocomplete: false });
      return;
    }

    // Autocomplete navigation
    if (bracketPopover.showAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setBracketPopover({
          ...bracketPopover,
          autocompleteIndex: Math.min(
            (bracketPopover.autocompleteIndex || 0) + 1,
            options.length - 1
          ),
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setBracketPopover({
          ...bracketPopover,
          autocompleteIndex: Math.max(
            (bracketPopover.autocompleteIndex || 0) - 1,
            0
          ),
        });
      }
    }
  };

  const removeBracketItem = (
    indexToRemove: number,
    fromNested = false
  ): void => {
    if (!bracketPopover) return;
    if (fromNested) {
      setBracketPopover({
        ...bracketPopover,
        nestedItems: (bracketPopover.nestedItems || []).filter(
          (_, i) => i !== indexToRemove
        ),
      });
    } else {
      setBracketPopover({
        ...bracketPopover,
        items: bracketPopover.items.filter((_, i) => i !== indexToRemove),
      });
    }
  };

  const validateBracketExpression = (items: BracketItem[]): string | null => {
    if (items.length === 0) return 'Bracket expression cannot be empty';

    // Must have at least one operator (can't be just a single value or wrapped number)
    const hasOperator = items.some((it) => it.type === 'operator');
    if (!hasOperator) {
      return 'Bracket expression must contain at least one operator (e.g., (#A - #B))';
    }

    // Cannot start with an operator
    if (items[0].type === 'operator') {
      return 'Bracket expression cannot start with an operator';
    }

    // Cannot end with an operator
    if (items[items.length - 1].type === 'operator') {
      return 'Bracket expression cannot end with an operator';
    }

    // Check consecutive operators and consecutive values
    for (let i = 0; i < items.length - 1; i++) {
      const cur = items[i];
      const nxt = items[i + 1];

      if (cur.type === 'operator' && nxt.type === 'operator') {
        return `Invalid: consecutive operators "${cur.value}${nxt.value}" are not allowed`;
      }

      const isValue = (it: BracketItem) =>
        it.type === 'chip' ||
        it.type === 'manual' ||
        it.type === 'number' ||
        it.type === 'bracket';
      if (isValue(cur) && isValue(nxt)) {
        return 'Missing operator between values';
      }
    }

    // Validate numbers (max 4 decimal places) — including inside nested brackets (recursive)
    for (const it of items) {
      if (it.type === 'number') {
        const decMatch = it.value.match(/\.(\d+)$/);
        if (decMatch && decMatch[1].length > 4) {
          return 'Maximum of 4 decimal places allowed for numbers';
        }
      }
      // Recurse into nested bracket items
      if (
        it.type === 'bracket' &&
        it.nestedItems &&
        it.nestedItems.length > 0
      ) {
        const nestedError = validateBracketExpression(it.nestedItems);
        if (nestedError) {
          return `Inside nested bracket: ${nestedError}`;
        }
      }
    }

    return null;
  };

  const handleBracketPopoverSave = (): void => {
    if (!bracketPopover) return;

    // Cannot save while in nested bracket mode
    if (bracketPopover.nestedMode) {
      setBracketPopover({
        ...bracketPopover,
        error: 'Close the nested bracket first by typing ) in the input field.',
      });
      return;
    }

    // Check for uncommitted input
    if (bracketPopover.inputValue.trim()) {
      setBracketPopover({
        ...bracketPopover,
        error:
          'Please press Enter to confirm the current input before saving, or clear it.',
      });
      return;
    }

    const validationError = validateBracketExpression(bracketPopover.items);
    if (validationError) {
      setBracketPopover({ ...bracketPopover, error: validationError });
      return;
    }

    // Build the bracket string value — no @ prefix for chips; # kept for manual entries
    const buildInnerStr = (items: BracketItem[]): string =>
      items
        .map((it) => {
          if (it.type === 'chip') {
            // Use actual RID for real field references (no @ prefix)
            const [parent, child] = it.value.split('.', 2);
            const objectId = targetOptions[parent]?.[child];
            return objectId || it.value; // RID if available, else Parent.Child
          } else if (it.type === 'bracket' && it.nestedItems) {
            return `(${buildInnerStr(it.nestedItems)})`;
          }
          return it.value; // operator, manual (keeps #), number
        })
        .join(' ');

    const bracketValue = `(${buildInnerStr(bracketPopover.items)})`;

    const bracketExpression: FieldExpression = {
      type: 'bracket' as const,
      value: bracketValue,
      bracketItems: bracketPopover.items,
    };

    // Save to clause condition field
    if (
      bracketPopover.source === 'clause-condition' &&
      conditionalPopover &&
      bracketPopover.clauseIndex !== undefined
    ) {
      const newClauses = [...conditionalPopover.clauses];
      const clause = { ...newClauses[bracketPopover.clauseIndex] };
      const newExpressions = [...(clause.expressions || [])];

      if (bracketPopover.clauseChipEditIndex !== undefined) {
        newExpressions[bracketPopover.clauseChipEditIndex] = bracketExpression;
      } else {
        newExpressions.push(bracketExpression);
      }

      clause.expressions = newExpressions;
      clause.inputValue = '';
      clause.error = undefined;
      newClauses[bracketPopover.clauseIndex] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      setBracketPopover(null);
      return;
    }

    // Save to clause return field
    if (
      bracketPopover.source === 'clause-return' &&
      conditionalPopover &&
      bracketPopover.clauseIndex !== undefined
    ) {
      const newClauses = [...conditionalPopover.clauses];
      const clause = { ...newClauses[bracketPopover.clauseIndex] };
      const newExpressions = [...(clause.returnExpressions || [])];

      if (bracketPopover.clauseChipEditIndex !== undefined) {
        newExpressions[bracketPopover.clauseChipEditIndex] = bracketExpression;
      } else {
        newExpressions.push(bracketExpression);
      }

      clause.returnExpressions = newExpressions;
      clause.returnInputValue = '';
      clause.returnError = undefined;
      newClauses[bracketPopover.clauseIndex] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      setBracketPopover(null);
      return;
    }

    // Default: save to main field
    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === bracketPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          if (bracketPopover.editingIndex !== undefined) {
            newExpressions[bracketPopover.editingIndex] = bracketExpression;
          } else {
            newExpressions.push(bracketExpression);
          }

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

    setBracketPopover(null);
  };

  const handleBracketPopoverCancel = (): void => {
    setBracketPopover(null);
  };

  const handleBracketChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'bracket') return;

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      setBracketPopover({
        rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
        source: 'main',
      });
    }
  };

  // ==================== SUMOF POPOVER HANDLERS ====================

  const handleSumOfPopoverInputChange = (value: string): void => {
    if (!sumOfPopover) return;
    setSumOfPopover({
      ...sumOfPopover,
      inputValue: value,
      error: undefined,
      showAutocomplete: value.includes('@'),
      autocompleteIndex: 0,
    });
  };

  const handleSumOfPopoverKeyDown = (event: React.KeyboardEvent): void => {
    if (!sumOfPopover) return;
    const currentInput = sumOfPopover.inputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      // Autocomplete selection
      if (sumOfPopover.showAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        if (options.length > 0) {
          const selectedOption = options[sumOfPopover.autocompleteIndex || 0];
          handleSumOfPopoverAutocompleteSelect(selectedOption);
          return;
        }
      }

      // Manual entry with #
      if (
        currentInput.trim().startsWith('#') &&
        currentInput.trim().length > 1
      ) {
        setSumOfPopover({
          ...sumOfPopover,
          selectedArg: { type: 'manual', value: currentInput.trim() },
          inputValue: '',
          showAutocomplete: false,
          error: undefined,
        });
        return;
      }

      if (currentInput.trim()) {
        setSumOfPopover({
          ...sumOfPopover,
          error: 'Use @ to select a field or # for a manual value',
        });
      }
      return;
    }

    // Backspace to clear selected arg when input is empty
    if (
      event.key === 'Backspace' &&
      !currentInput &&
      sumOfPopover.selectedArg
    ) {
      event.preventDefault();
      setSumOfPopover({
        ...sumOfPopover,
        selectedArg: undefined,
      });
      return;
    }

    // Autocomplete navigation
    if (sumOfPopover.showAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSumOfPopover({
          ...sumOfPopover,
          autocompleteIndex: Math.min(
            (sumOfPopover.autocompleteIndex || 0) + 1,
            options.length - 1
          ),
        });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSumOfPopover({
          ...sumOfPopover,
          autocompleteIndex: Math.max(
            (sumOfPopover.autocompleteIndex || 0) - 1,
            0
          ),
        });
      }
    }
  };

  const handleSumOfPopoverAutocompleteSelect = (
    selectedValue: string
  ): void => {
    if (!sumOfPopover) return;

    // Check if it's a parent.child (complete) or just parent
    const isComplete = selectedValue.includes('.');
    if (!isComplete) {
      // User selected a parent, add dot and show children
      setSumOfPopover({
        ...sumOfPopover,
        inputValue: `@${selectedValue}.`,
        showAutocomplete: true,
        autocompleteIndex: 0,
      });
      return;
    }

    // Complete selection - set as selected arg
    setSumOfPopover({
      ...sumOfPopover,
      selectedArg: { type: 'chip', value: selectedValue },
      inputValue: '',
      showAutocomplete: false,
      error: undefined,
    });
  };

  const handleSumOfPopoverSave = (): void => {
    if (!sumOfPopover) return;

    if (!sumOfPopover.selectedArg) {
      setSumOfPopover({
        ...sumOfPopover,
        error: 'Please select a field (@) or enter a manual value (#)',
      });
      return;
    }

    if (sumOfPopover.inputValue.trim()) {
      setSumOfPopover({
        ...sumOfPopover,
        error: 'Please clear the input or press Enter to confirm before saving',
      });
      return;
    }

    // Build the payload value
    let argPayload = '';
    if (sumOfPopover.selectedArg.type === 'chip') {
      const [parent, child] = sumOfPopover.selectedArg.value.split('.', 2);
      const objectId = targetOptions[parent]?.[child] || '';
      argPayload = objectId || sumOfPopover.selectedArg.value;
    } else {
      argPayload = sumOfPopover.selectedArg.value;
    }

    const sumValue = `SUM(${argPayload})`;
    const sumExpression: FieldExpression = {
      type: 'sumOf' as const,
      value: sumValue,
      sumOfArg: sumOfPopover.selectedArg,
    };

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === sumOfPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          if (sumOfPopover.editingIndex !== undefined) {
            newExpressions[sumOfPopover.editingIndex] = sumExpression;
          } else {
            newExpressions.push(sumExpression);
          }

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

    setSumOfPopover(null);
  };

  const handleSumOfPopoverCancel = (): void => {
    setSumOfPopover(null);
  };

  const handleSumOfChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;
    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'sumOf') return;

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      setSumOfPopover({
        rid,
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
        selectedArg: expression.sumOfArg,
      });
    }
  };

  const removeFunctionPopoverChip = (indexToRemove: number): void => {
    if (!functionPopover) return;

    setFunctionPopover({
      ...functionPopover,
      args: functionPopover.args.filter((_, index) => index !== indexToRemove),
    });
  };

  const handleFunctionPopoverSave = (): void => {
    if (!functionPopover) return;

    // Validate: check for invalid text in input field
    if (
      functionPopover.inputValue.trim() &&
      !functionPopover.inputValue.trim().startsWith('@') &&
      !functionPopover.inputValue.trim().startsWith('#')
    ) {
      setFunctionPopover({
        ...functionPopover,
        error:
          'Invalid text in input field. Use @ for fields or # for manual values.',
      });
      return;
    }

    // Validate: must have at least 2 arguments
    if (functionPopover.args.length < 2) {
      setFunctionPopover({
        ...functionPopover,
        error: `${functionPopover.type} function requires at least 2 arguments`,
      });
      return;
    }

    // Convert args to payload format (object RIDs or manual values)
    const functionArgs: string[] = functionPopover.args.map((arg) => {
      if (arg.type === 'chip') {
        const [parent, child] = arg.value.split('.', 2);
        return targetOptions[parent]?.[child] || '';
      } else {
        return arg.value; // Manual entry
      }
    });

    // Convert args to display format
    const displayArgs = functionPopover.args.map((arg) => arg.value);

    // Add or update function expression
    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === functionPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          const functionExpression: FieldExpression = {
            type: 'function' as const,
            value: `${functionPopover.type}(${displayArgs.join(', ')})`,
            functionType: functionPopover.type,
            functionArgs: functionArgs,
          };

          // Check if we're editing an existing function
          if (functionPopover.editingIndex !== undefined) {
            // Replace the existing function
            newExpressions[functionPopover.editingIndex] = functionExpression;
          } else {
            // Add new function
            newExpressions.push(functionExpression);
          }

          // Build ObjectRidMap from expressions
          return {
            ...m,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            targetError: undefined,
            inputValue: '', // Clear the MIN/MAX text from main input
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });

    // Close popover
    setFunctionPopover(null);
  };

  const handleFunctionPopoverCancel = (): void => {
    setFunctionPopover(null);
  };

  const handleFunctionChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'function') return;

    // Convert function args back to FieldExpression format for editing
    const args: FieldExpression[] =
      expression.functionArgs?.map((arg) => {
        if (arg.startsWith('#')) {
          return { type: 'manual' as const, value: arg };
        } else {
          // Find the object by RID
          const objectItem = objectsList.find((obj) => obj.rid === arg);
          if (objectItem) {
            return {
              type: 'chip' as const,
              value: `${objectItem.parent_object}.${objectItem.object_name}`,
            };
          }
          return { type: 'manual' as const, value: arg };
        }
      }) || [];

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      setFunctionPopover({
        rid,
        type: expression.functionType || 'MIN',
        args,
        inputValue: '',
        anchorEl: containerElement,
        editingIndex: index,
      });
    }
  };

  // Conditional popover handlers - Chip-based building
  const handleClauseInputChange = (index: number, value: string): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };

    // Clear error on change
    clause.error = undefined;

    // Check for operators - IMPORTANT: Check longer operators first!
    const operators = [
      '===',
      '!==',
      '<=',
      '>=',
      '&&',
      '||',
      '<',
      '>',
      '+',
      '-',
      '*',
      '/',
      '%',
    ];

    // Don't auto-add if user might be typing a compound operator
    // For example, if value ends with '<', they might be typing '<='
    const potentialCompoundChars = ['<', '>', '=', '!', '&', '|'];
    const lastChar = value.slice(-1);
    const isPotentialCompound = potentialCompoundChars.includes(lastChar);

    // Only check for operator match if:
    // 1. It's not a potential compound start, OR
    // 2. It's a complete multi-char operator
    const operatorMatch = operators.find((op) => value.endsWith(op));

    if (operatorMatch && (!isPotentialCompound || operatorMatch.length > 1)) {
      // Add operator chip
      clause.expressions = [
        ...(clause.expressions || []),
        { type: 'operator', value: operatorMatch },
      ];
      clause.inputValue = '';
      clause.showAutocomplete = false;

      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      return;
    }

    // Check for autocomplete trigger
    const atIndex = value.lastIndexOf('@');
    const shouldShow = atIndex !== -1 && atIndex >= 0;

    clause.inputValue = value;
    clause.showAutocomplete = shouldShow;
    if (shouldShow) {
      clause.autocompleteIndex = 0;
    }

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleClauseKeyDown = (
    index: number,
    event: React.KeyboardEvent
  ): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      // 1. Check Autocomplete Selection
      if (clause.showAutocomplete) {
        const options = getPopoverFilteredOptions(
          currentInput.substring(currentInput.lastIndexOf('@') + 1)
        );
        if (options.length > 0) {
          const selectedOption = options[clause.autocompleteIndex || 0];
          handleClauseAutocompleteSelect(index, selectedOption);
          return;
        }
      }

      // 1.5. Bracket Entry - type '(' and press Enter to open bracket popover
      if (currentInput.trim() === '(') {
        const anchorEl =
          clauseContainerRefs.current[index] || conditionalPopover.anchorEl;
        if (anchorEl) {
          clause.inputValue = '';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          setBracketPopover({
            rid: conditionalPopover.rid,
            items: [],
            inputValue: '',
            anchorEl: anchorEl,
            source: 'clause-condition',
            clauseIndex: index,
          });
        }
        return;
      }

      // 2. Manual Entry (#)
      if (currentInput.trim().startsWith('#')) {
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'manual', value: currentInput.trim() },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      // 3. Number Entry
      const numberInput = currentInput.trim();
      const numberRegex = /^-?\d+(\.\d+)?$/;
      if (numberRegex.test(numberInput)) {
        // Validate max 4 decimal places
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          clause.error = 'Maximum of 4 decimal places allowed for numbers';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          return;
        }
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'number', value: numberInput },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      // 4. Operator Entry (Manual)
      const opInput = currentInput.trim();
      const isFullOp = [
        '===',
        '!==',
        '&&',
        '||',
        '+',
        '-',
        '*',
        '/',
        '%',
        '>=',
        '<=',
        '>',
        '<',
      ].includes(opInput);
      if (isFullOp) {
        clause.expressions = [
          ...(clause.expressions || []),
          { type: 'operator', value: opInput },
        ];
        clause.inputValue = '';
        clause.showAutocomplete = false;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
        return;
      }

      // 5. Invalid Input Fallback
      if (currentInput.trim()) {
        clause.error = `Invalid input: "${currentInput.trim()}". Please use @ for fields, # for manual, ( for brackets, or enter valid numbers/operators.`;
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      }
    }

    // Autocomplete Navigation
    if (clause.showAutocomplete) {
      const options = getPopoverFilteredOptions(
        currentInput.substring(currentInput.lastIndexOf('@') + 1)
      );

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        clause.autocompleteIndex = Math.min(
          (clause.autocompleteIndex || 0) + 1,
          options.length - 1
        );
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        clause.autocompleteIndex = Math.max(
          (clause.autocompleteIndex || 0) - 1,
          0
        );
        newClauses[index] = clause;
        setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      }
    }
  };

  const handleClauseAutocompleteSelect = (
    index: number,
    selectedValue: string
  ): void => {
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.error = undefined;
    const currentInput = clause.inputValue || '';

    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const isCompleteProperty = selectedValue.includes('.');

    if (!isCompleteProperty) {
      // Parent selected, append dot and keep autocomplete open
      const newInputValue =
        currentInput.substring(0, atIndex + 1) + selectedValue + '.';
      clause.inputValue = newInputValue;
      // Keep autocomplete open
      clause.showAutocomplete = true;
      clause.autocompleteIndex = 0;
    } else {
      // Complete selection -> Add Chip
      clause.expressions = [
        ...(clause.expressions || []),
        { type: 'chip', value: selectedValue },
      ];
      clause.inputValue = '';
      clause.showAutocomplete = false;
    }

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleClauseRemoveChip = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[clauseIndex] };
    clause.error = undefined;

    const newExpressions = [...(clause.expressions || [])];
    newExpressions.splice(chipIndex, 1);

    clause.expressions = newExpressions;
    newClauses[clauseIndex] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleAddElseIf = (): void => {
    if (!conditionalPopover) return;

    setConditionalPopover({
      ...conditionalPopover,
      clauses: [
        ...conditionalPopover.clauses,
        {
          type: 'ELSE_IF',
          condition: '',
          expressions: [], // Initialize with empty expressions for the new input
          inputValue: '',
          result: '',
          returnExpressions: [],
          returnInputValue: '',
        },
      ],
    });
  };

  const handleAddElse = (): void => {
    if (!conditionalPopover) return;

    setConditionalPopover({
      ...conditionalPopover,
      clauses: [
        ...conditionalPopover.clauses,
        {
          type: 'ELSE',
          result: '',
          returnExpressions: [],
          returnInputValue: '',
        },
      ],
    });
  };

  const handleRemoveClause = (index: number): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    newClauses.splice(index, 1);

    setConditionalPopover({
      ...conditionalPopover,
      clauses: newClauses,
    });
  };

  // Return field handlers - similar to condition field but focused on return value
  const handleReturnInputChange = (index: number, value: string): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };

    // Clear error on change
    clause.returnError = undefined;

    // Check for operators - IMPORTANT: Check longer operators first!
    const operators = ['+', '-', '*', '/'];

    const operatorMatch = operators.find((op) => value.endsWith(op));

    if (operatorMatch && value.length > 0) {
      // Extract everything before the operator
      const beforeOperator = value.slice(0, -operatorMatch.length).trim();

      if (beforeOperator) {
        // Process pending input before operator
        const atIndex = beforeOperator.lastIndexOf('@');

        if (atIndex !== -1) {
          // Incomplete autocomplete - add as text
          const chipValue = beforeOperator.substring(atIndex);
          const updated = [...(clause.returnExpressions || [])];
          updated.push({ type: 'manual', value: chipValue });
          clause.returnExpressions = updated;
        } else if (
          beforeOperator.trim() &&
          !beforeOperator.trim().startsWith('@')
        ) {
          // Manual text or number
          if (!isNaN(Number(beforeOperator.trim()))) {
            clause.returnExpressions = [
              ...(clause.returnExpressions || []),
              { type: 'number', value: beforeOperator.trim() },
            ];
          } else {
            clause.returnExpressions = [
              ...(clause.returnExpressions || []),
              { type: 'manual', value: beforeOperator.trim() },
            ];
          }
        }
      }

      // Add operator
      let operatorText = '';
      switch (operatorMatch) {
        case '+':
          operatorText = '+';
          break;
        case '-':
          operatorText = '-';
          break;
        case '*':
          operatorText = '*';
          break;
        case '/':
          operatorText = '/';
          break;
      }
      clause.returnExpressions = [
        ...(clause.returnExpressions || []),
        { type: 'operator', value: operatorText },
      ];
      clause.returnInputValue = '';
    } else {
      clause.returnInputValue = value;
    }

    // Check for autocomplete trigger
    const atIndex = (clause.returnInputValue || '').lastIndexOf('@');
    const shouldShow = atIndex !== -1 && atIndex >= 0;

    clause.returnShowAutocomplete = shouldShow;
    if (shouldShow) {
      clause.returnAutocompleteIndex = 0;
    }

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleReturnKeyDown = (
    index: number,
    event: React.KeyboardEvent
  ): void => {
    if (!conditionalPopover) return;

    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.returnError = undefined;
    const currentInput = clause.returnInputValue || '';

    if (event.key === 'Enter') {
      event.preventDefault();

      // Handle autocomplete selection
      if (clause.returnShowAutocomplete) {
        const searchText = currentInput.substring(
          currentInput.lastIndexOf('@') + 1
        );
        const options = getPopoverFilteredOptions(searchText);
        const selectedOption = options[clause.returnAutocompleteIndex || 0];

        if (selectedOption) {
          handleReturnAutocompleteSelect(index, selectedOption);
        }
        return;
      }

      // Handle bracket entry - type '(' and press Enter to open bracket popover
      if (currentInput.trim() === '(') {
        const anchorEl =
          returnContainerRefs.current[index] || conditionalPopover.anchorEl;
        if (anchorEl) {
          clause.returnInputValue = '';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          setBracketPopover({
            rid: conditionalPopover.rid,
            items: [],
            inputValue: '',
            anchorEl: anchorEl,
            source: 'clause-return',
            clauseIndex: index,
          });
        }
        return;
      }

      // Handle manual entry (#) or numbers
      if (currentInput.trim().startsWith('#')) {
        const manualValue = currentInput.trim().substring(1).trim();
        if (manualValue) {
          clause.returnExpressions = [
            ...(clause.returnExpressions || []),
            { type: 'manual', value: `#${manualValue}` },
          ];
          clause.returnInputValue = '';
        }
      } else if (currentInput.trim() && !isNaN(Number(currentInput.trim()))) {
        // It's a number — validate max 4 decimal places
        const numberInput = currentInput.trim();
        const decimalMatch = numberInput.match(/\.(\d+)$/);
        if (decimalMatch && decimalMatch[1].length > 4) {
          clause.returnError =
            'Maximum of 4 decimal places allowed for numbers';
          newClauses[index] = clause;
          setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
          return;
        }
        clause.returnExpressions = [
          ...(clause.returnExpressions || []),
          { type: 'number', value: numberInput },
        ];
        clause.returnInputValue = '';
      }

      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
      return;
    }

    // Autocomplete Navigation
    if (clause.returnShowAutocomplete) {
      const searchText = currentInput.substring(
        currentInput.lastIndexOf('@') + 1
      );
      const options = getPopoverFilteredOptions(searchText);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          clause.returnAutocompleteIndex = Math.min(
            (clause.returnAutocompleteIndex || 0) + 1,
            options.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          clause.returnAutocompleteIndex = Math.max(
            (clause.returnAutocompleteIndex || 0) - 1,
            0
          );
          break;
        case 'Escape':
          event.preventDefault();
          clause.returnShowAutocomplete = false;
          break;
      }

      newClauses[index] = clause;
      setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
    }
  };

  const handleReturnAutocompleteSelect = (
    index: number,
    selectedValue: string
  ): void => {
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[index] };
    clause.returnError = undefined;
    const currentInput = clause.returnInputValue || '';

    const atIndex = currentInput.lastIndexOf('@');
    if (atIndex === -1) return;

    const isCompleteProperty = selectedValue.includes('.');

    if (!isCompleteProperty) {
      // Parent selected - keep showing autocomplete with updated search
      clause.returnInputValue =
        currentInput.substring(0, atIndex) + '@' + selectedValue + '.';
    } else {
      // Complete selection - add as chip
      clause.returnExpressions = [
        ...(clause.returnExpressions || []),
        { type: 'chip', value: selectedValue },
      ];
      clause.returnInputValue = '';
      clause.returnShowAutocomplete = false;
    }

    newClauses[index] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  const handleReturnRemoveChip = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    if (!conditionalPopover) return;
    const newClauses = [...conditionalPopover.clauses];
    const clause = { ...newClauses[clauseIndex] };
    clause.returnError = undefined;

    const newExpressions = [...(clause.returnExpressions || [])];
    newExpressions.splice(chipIndex, 1);

    clause.returnExpressions = newExpressions;
    newClauses[clauseIndex] = clause;
    setConditionalPopover({ ...conditionalPopover, clauses: newClauses });
  };

  // Bracket chip click handler for clause condition field
  const handleClauseBracketChipClick = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    if (!conditionalPopover) return;
    const clause = conditionalPopover.clauses[clauseIndex];
    const expression = (clause.expressions || [])[chipIndex];
    if (!expression || expression.type !== 'bracket') return;

    const anchorEl =
      clauseContainerRefs.current[clauseIndex] || conditionalPopover.anchorEl;
    if (anchorEl) {
      setBracketPopover({
        rid: conditionalPopover.rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl: anchorEl,
        source: 'clause-condition',
        clauseIndex: clauseIndex,
        clauseChipEditIndex: chipIndex,
      });
    }
  };

  // Bracket chip click handler for clause return field
  const handleReturnBracketChipClick = (
    clauseIndex: number,
    chipIndex: number
  ): void => {
    if (!conditionalPopover) return;
    const clause = conditionalPopover.clauses[clauseIndex];
    const expression = (clause.returnExpressions || [])[chipIndex];
    if (!expression || expression.type !== 'bracket') return;

    const anchorEl =
      returnContainerRefs.current[clauseIndex] || conditionalPopover.anchorEl;
    if (anchorEl) {
      setBracketPopover({
        rid: conditionalPopover.rid,
        items: expression.bracketItems || [],
        inputValue: '',
        anchorEl: anchorEl,
        source: 'clause-return',
        clauseIndex: clauseIndex,
        clauseChipEditIndex: chipIndex,
      });
    }
  };

  const handleConditionalPopoverSave = (): void => {
    if (!conditionalPopover) return;

    const clauses = conditionalPopover.clauses;

    // Validation: Ensure IF exists
    if (clauses.length === 0 || !clauses.some((c) => c.type === 'IF')) {
      setConditionalPopover({
        ...conditionalPopover,
        error: 'Please start the expression with an IF statement',
      });
      return;
    }

    // Clear loop for validation and payload construction
    const newClauses = [...clauses];
    let hasValidationErrors = false;
    const payloadParts: string[] = [];

    // First pass: Validate ALL clauses and collect errors
    for (let i = 0; i < newClauses.length; i++) {
      const clause = { ...newClauses[i] };
      // Clear previous errors
      clause.error = undefined;
      clause.returnError = undefined;

      // ============ CONDITION VALIDATION (IF and ELSE_IF only) ============
      if (clause.type !== 'ELSE') {
        // Rule: Invalid input validation (Check for uncommitted text)
        if (clause.inputValue && clause.inputValue.trim()) {
          clause.error = `Invalid text in input field. Use @ for fields or # for manual values.`;
          hasValidationErrors = true;
        }

        // Validation Logic for Expressions
        const expressions = clause.expressions || [];

        if (expressions.length === 0 && !clause.inputValue) {
          if (clause.type === 'IF') {
            clause.error = 'The IF condition cannot be empty';
            hasValidationErrors = true;
          } else if (clause.type === 'ELSE_IF') {
            clause.error =
              'Please enter a condition or remove this ELSE IF block';
            hasValidationErrors = true;
          }
        } else if (expressions.length > 0) {
          // Rule: Number validation (Check for valid numbers in chips)
          expressions.forEach((exp) => {
            if (exp.type === 'number') {
              if (isNaN(Number(exp.value)) || exp.value.trim() === '') {
                clause.error = `Invalid number value: ${exp.value}`;
                hasValidationErrors = true;
              } else {
                // Validate max 4 decimal places
                const decimalMatch = exp.value.match(/\.(\d+)$/);
                if (decimalMatch && decimalMatch[1].length > 4) {
                  clause.error =
                    'Maximum of 4 decimal places allowed for numbers';
                  hasValidationErrors = true;
                }
              }
            }
          });

          if (hasValidationErrors) {
            // Continue to collect other errors or stop? Let's keep checking for logic errors.
          }

          // Define operator categories
          const comparisonOps = ['===', '!==', '>', '<', '>=', '<='];
          const arithmeticOps = ['+', '-', '*', '/', '%'];
          const logicalOps = ['&&', '||'];

          // Rule 0: Minimum 3 chips for each sub-condition (split by &&, ||)
          const segments: FieldExpression[][] = [[]];
          expressions.forEach((exp) => {
            if (
              exp.type === 'operator' &&
              (exp.value === '&&' || exp.value === '||')
            ) {
              segments.push([]);
            } else {
              segments[segments.length - 1].push(exp);
            }
          });

          if (segments.some((seg) => seg.length > 0 && seg.length < 3)) {
            clause.error =
              'Each part of the condition must be fully defined (e.g., value === 10)';
            hasValidationErrors = true;
          }
          // Rule 1: Cannot start with operator
          if (expressions[0].type === 'operator') {
            clause.error =
              'A condition cannot start with a operator or (&&, ||) symbol';
            hasValidationErrors = true;
          }
          // Rule 2: Cannot end with operator
          else if (expressions[expressions.length - 1].type === 'operator') {
            clause.error =
              'Condition cannot end with a operators or (&&, ||) symbol';
            hasValidationErrors = true;
          } else {
            // Sequence Rules with strict operator validation
            let conditionComplete = false; // Track when a complete condition exists (operand + operator + operand)

            for (let j = 0; j < expressions.length - 1; j++) {
              const current = expressions[j];
              const next = expressions[j + 1];

              const isCurrentOperator = current.type === 'operator';
              const isNextOperator = next.type === 'operator';

              const isCurrentOperand = !isCurrentOperator;
              const isNextOperand = !isNextOperator;

              // Rule 3: Operand followed by Operand (Missing Operator)
              if (isCurrentOperand && isNextOperand) {
                clause.error =
                  'Please use && or || to connect multiple conditions';
                hasValidationErrors = true;
                break; // Stop checking this clause
              }

              // Rule 4: Operator followed by Operator (Duplicate Operator)
              if (isCurrentOperator && isNextOperator) {
                clause.error =
                  'The symbol sequence in the condition is invalid';
                hasValidationErrors = true;
                break;
              }

              // NEW Rule 5: Track condition completion and validate operator usage
              if (isCurrentOperator) {
                const opValue = current.value;
                const isComparison = comparisonOps.includes(opValue);
                const isArithmetic = arithmeticOps.includes(opValue);
                const isLogical = logicalOps.includes(opValue);

                // If we already have a complete condition and next operator is not logical
                if (conditionComplete && (isComparison || isArithmetic)) {
                  clause.error = `Invalid operator "${opValue}". Use && or || to connect conditions`;
                  hasValidationErrors = true;
                  break;
                }

                // Mark condition as complete after: operand + (comparison/arithmetic) + operand
                if ((isComparison || isArithmetic) && isNextOperand) {
                  // Check if operand after this operator completes the condition
                  if (
                    j + 2 < expressions.length &&
                    expressions[j + 2].type === 'operator'
                  ) {
                    conditionComplete = true;
                  }
                }

                // Reset completion flag after logical operator
                if (isLogical) {
                  conditionComplete = false;
                }
              }
            }
          }
        }
      }

      // ============ RETURN FIELD VALIDATION (ALL clause types) ============
      // Return field is mandatory
      const returnExpressions = clause.returnExpressions || [];
      const returnInput = clause.returnInputValue || '';

      // Check for uncommitted input
      if (returnInput.trim()) {
        clause.returnError = `Invalid text in then field. Use @ for fields or # for manual values.`;
        hasValidationErrors = true;
      }

      // Return field cannot be empty
      if (returnExpressions.length === 0 && !returnInput.trim()) {
        clause.returnError = 'Then value is required';
        hasValidationErrors = true;
      } else if (returnExpressions.length > 0) {
        // Validate return expressions (similar to Source field validation)

        // Rule: Number validation
        returnExpressions.forEach((exp) => {
          if (exp.type === 'number') {
            if (isNaN(Number(exp.value)) || exp.value.trim() === '') {
              clause.returnError = `Invalid number value: ${exp.value}`;
              hasValidationErrors = true;
            } else {
              // Validate max 4 decimal places
              const decimalMatch = exp.value.match(/\.(\d+)$/);
              if (decimalMatch && decimalMatch[1].length > 4) {
                clause.returnError =
                  'Maximum of 4 decimal places allowed for numbers';
                hasValidationErrors = true;
              }
            }
          }
        });

        // Rule: Cannot start with operator
        if (returnExpressions[0].type === 'operator') {
          clause.returnError = 'Then value cannot start with an operator';
          hasValidationErrors = true;
        }
        // Rule: Cannot end with operator
        else if (
          returnExpressions[returnExpressions.length - 1].type === 'operator'
        ) {
          clause.returnError = 'Then value cannot end with an operator';
          hasValidationErrors = true;
        } else {
          // Check for consecutive operators or consecutive values
          for (let j = 0; j < returnExpressions.length - 1; j++) {
            const current = returnExpressions[j];
            const next = returnExpressions[j + 1];

            if (current.type === 'operator' && next.type === 'operator') {
              clause.returnError = 'Cannot have consecutive operators';
              hasValidationErrors = true;
              break;
            }

            const isCurrentValue =
              current.type === 'chip' ||
              current.type === 'manual' ||
              current.type === 'number' ||
              current.type === 'bracket';
            const isNextValue =
              next.type === 'chip' ||
              next.type === 'manual' ||
              next.type === 'number' ||
              next.type === 'bracket';

            if (isCurrentValue && isNextValue) {
              clause.returnError = 'Missing operator between values';
              hasValidationErrors = true;
              break;
            }
          }
        }
      }

      newClauses[i] = clause;
    }

    if (hasValidationErrors) {
      setConditionalPopover({
        ...conditionalPopover,
        clauses: newClauses,
        error: undefined, // Clear global error
      });
      return;
    }

    // Second pass: Construct Payload (only if no errors)
    const validClauses: ConditionalClause[] = [];
    for (let i = 0; i < newClauses.length; i++) {
      const clause = newClauses[i];

      // Build condition string from expressions (for IF and ELSE_IF)
      let conditionStr = '';
      if (clause.type !== 'ELSE') {
        conditionStr = (clause.expressions || [])
          .map((exp) => {
            if (exp.type === 'chip') {
              const [parent, child] = exp.value.split('.', 2);
              const objectId = targetOptions[parent]?.[child] || '';
              return objectId;
            } else if (exp.type === 'operator') {
              return ` ${exp.value} `;
            } else if (exp.type === 'bracket') {
              return exp.value; // Pre-built bracket string like (rid1 + rid2)
            } else {
              return exp.value;
            }
          })
          .join('');
      }

      // Build return string from return expressions
      const returnStr = (clause.returnExpressions || [])
        .map((exp) => {
          if (exp.type === 'chip') {
            const [parent, child] = exp.value.split('.', 2);
            const objectId = targetOptions[parent]?.[child] || '';
            return objectId;
          } else if (exp.type === 'operator') {
            return ` ${exp.value} `;
          } else if (exp.type === 'bracket') {
            return exp.value; // Pre-built bracket string like (rid1 + rid2)
          } else {
            return exp.value;
          }
        })
        .join('');

      const validClause: ConditionalClause = {
        ...clause,
        condition: conditionStr.trim(),
        result: returnStr.trim(), // This is the actual return value
        expressions: clause.expressions,
        returnExpressions: clause.returnExpressions,
      };
      validClauses.push(validClause);

      // Build payload string
      if (clause.type === 'IF') {
        payloadParts.push(
          `IF(${conditionStr.trim()}) { THEN ${returnStr.trim()} }`
        );
      } else if (clause.type === 'ELSE_IF') {
        payloadParts.push(
          `ELSE IF(${conditionStr.trim()}) { THEN ${returnStr.trim()} }`
        );
      } else if (clause.type === 'ELSE') {
        payloadParts.push(`ELSE { THEN ${returnStr.trim()} }`);
      }
    }

    const payloadValue = payloadParts.join(' ');

    const conditionalExpression: ConditionalExpression = {
      clauses: validClauses,
    };

    setLocalMappings((prev) => {
      const updated = prev.map((m) => {
        if (m.rid === conditionalPopover.rid) {
          const newExpressions = [...(m.fieldExpressions || [])];

          const conditionalExp: FieldExpression = {
            type: 'conditional' as const,
            value: payloadValue, // This is the string representation like IF(..., ...) ELSE IF(..., ...) ELSE(...)
            conditionalData: conditionalExpression,
          };

          if (conditionalPopover.editingIndex !== undefined) {
            newExpressions[conditionalPopover.editingIndex] = conditionalExp;
          } else {
            newExpressions.push(conditionalExp);
          }

          // Build ObjectRidMap for payload from all expressions (sequential odd/even index logic)
          return {
            ...m,
            fieldExpressions: newExpressions,
            calculation_config: buildCalculationConfig(newExpressions),
            inputValue: '',
          };
        }
        return m;
      });
      onMappingsChange(updated);
      return updated;
    });

    setConditionalPopover(null);
  };

  const handleConditionalPopoverCancel = (): void => {
    setConditionalPopover(null);
  };

  const handleConditionalChipClick = (rid: string, index: number): void => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return;

    const expression = mapping.fieldExpressions?.[index];
    if (!expression || expression.type !== 'conditional') return;

    if (!expression.conditionalData) return;

    const containerElement = containerRefs.current[rid];
    if (containerElement) {
      // Load clauses and ensure expressions and return expressions exist
      const loadedClauses = expression.conditionalData.clauses.map((c) => ({
        ...c,
        // If expressions missing (legacy), convert condition string to manual chip
        expressions:
          c.expressions ||
          (c.condition
            ? [{ type: 'manual' as const, value: c.condition }]
            : []),
        inputValue: '',
        showAutocomplete: false,
        autocompleteIndex: 0,
        // Load return expressions (if missing, try to parse from result)
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

  const getFilteredOptions = (
    rid: string,
    customSearchText?: string
  ): string[] => {
    const mapping = localMappings.find((m) => m.rid === rid);
    if (!mapping) return [];

    let searchText: string;

    if (customSearchText !== undefined) {
      // Called from popover with custom search text
      searchText = customSearchText;
    } else {
      // Called from main field - extract from inputValue
      const currentInput = mapping.inputValue || '';
      const atIndex = currentInput.lastIndexOf('@');

      if (atIndex === -1) return [];

      searchText = currentInput.substring(atIndex + 1);
    }

    const lowerSearchText = searchText.toLowerCase();

    // Filter objectsList by field_type to match the mapping's field_type
    const filteredObjectsList = objectsList.filter(
      (obj) => obj.field_type === mapping.field_type
    );

    // Build targetOptions from filtered objects
    const filteredTargetOptions: Record<string, Record<string, string>> = {};
    filteredObjectsList.forEach((item) => {
      if (!filteredTargetOptions[item.parent_object]) {
        filteredTargetOptions[item.parent_object] = {};
      }
      filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
    });

    if (lowerSearchText === '') {
      const parents = Object.keys(filteredTargetOptions);
      return parents;
    }

    const dotCount = (lowerSearchText.match(/\./g) || []).length;

    if (dotCount >= 1) {
      const [parentKeyLower, childKeyLower = ''] = lowerSearchText.split(
        '.',
        2
      );

      // Find the actual parent key (case-insensitive match)
      const actualParentKey = Object.keys(filteredTargetOptions).find(
        (key) => key.toLowerCase() === parentKeyLower
      );

      if (actualParentKey && filteredTargetOptions[actualParentKey]) {
        const children = filteredTargetOptions[actualParentKey];

        // If childKey is empty (e.g., "Case."), show all children
        if (childKeyLower === '') {
          const allChildren = Object.keys(children).map(
            (child) => `${actualParentKey}.${child}`
          );
          return allChildren;
        }

        // Otherwise filter children based on childKey (case-insensitive)
        const filteredChildren = Object.keys(children).filter((child) =>
          child.toLowerCase().includes(childKeyLower)
        );

        const result = filteredChildren.map(
          (child) => `${actualParentKey}.${child}`
        );
        return result;
      }

      return [];
    }

    // Filter parent objects (case-insensitive)
    const filteredKeys = Object.keys(filteredTargetOptions).filter((key) =>
      key.toLowerCase().includes(lowerSearchText)
    );

    return filteredKeys;
  };

  const getDisplayName = (optionValue: string, rid: string): string => {
    const dotCount = (optionValue.match(/\./g) || []).length;

    if (dotCount === 1) {
      // parent.child format - show as is
      return optionValue;
    } else {
      // parent only - show count of children filtered by field_type
      const mapping = localMappings.find((m) => m.rid === rid);
      if (!mapping) return optionValue;

      // Filter objectsList by field_type to match the mapping's field_type
      const filteredObjectsList = objectsList.filter(
        (obj) => obj.field_type === mapping.field_type
      );

      // Build targetOptions from filtered objects
      const filteredTargetOptions: Record<string, Record<string, string>> = {};
      filteredObjectsList.forEach((item) => {
        if (!filteredTargetOptions[item.parent_object]) {
          filteredTargetOptions[item.parent_object] = {};
        }
        filteredTargetOptions[item.parent_object][item.object_name] = item.rid;
      });

      const parentData = filteredTargetOptions[optionValue];
      if (parentData) {
        const childCount = Object.keys(parentData).length;
        return `${optionValue} (${childCount})`;
      }
      return optionValue;
    }
  };

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
            '& .MuiTableCell-root:last-child': {
              borderTopRightRadius: '4px',
            },
          }}
        >
          <TableRow>
            <TableCell
              sx={{
                width: '30%',
              }}
            >
              Field Label
            </TableCell>
            <TableCell
              sx={{
                width: '20%',
              }}
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
                  slotProps={{
                    tooltip: {
                      sx: {
                        mr: 1,
                      },
                    },
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
            <TableCell
              sx={{
                width: '10%',
              }}
            >
              Field Type
            </TableCell>
            <TableCell
              sx={{
                width: '40%',
              }}
              className='flex items-center justify-between'
            >
              <span>Source</span>
              <span>
                <Tooltip
                  title={
                    'How to add fields to Source:\n• Type @ to select fields from dropdown (e.g., @Parent.Child)\n• Type # for IDs, then press Enter (e.g., #ID123)\n• Enter numbers directly, then press Enter (e.g., 10, 10.5, 10.5555) - max 4 decimal places\n• Type ( then press Enter to add bracket expression (e.g., (#A - #B))\n• Type MIN, MAX or SUM for functions, then press Enter\n• Type IF for conditional expressions (if/else/else if), then press Enter\n• Use operators: +, -, *, / between values'
                  }
                  arrow
                  placement='left'
                  slotProps={{
                    tooltip: {
                      sx: {
                        mr: 1,
                        whiteSpace: 'pre-line',
                      },
                    },
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
                <TableCell
                  sx={{ p: '8px', maxHeight: '90px', verticalAlign: 'top' }}
                >
                  <TruncateWithTooltip
                    text={mapping.field_label}
                    maxHeight='90px'
                    tooltipMaxWidth={'20vw'}
                    style={
                      {
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal', // Override default nowrap
                        textOverflow: 'clip', // Override ellipsis for multi-line
                      } as React.CSSProperties
                    }
                  />
                </TableCell>
                <TableCell sx={{ p: '8px' }}>
                  <div className='flex flex-col gap-1 h-full'>
                    <div
                      className={`flex flex-col relative w-full h-full ${mapping.fieldIdError ? 'bg-[#FEF2F2]' : ''}`}
                    >
                      <textarea
                        value={mapping.field_id || ''}
                        onChange={(e) => {
                          handleFieldIdChange(mapping.rid, e.target.value);
                          // auto-grow height
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                        disabled={formType === 'non-fillable'}
                        placeholder='Enter Field ID'
                        className={`w-full flex-1 min-h-[32px] max-h-[90px] px-2 py-1 ${mapping.status === 'anomaly' && formType !== 'non-fillable' ? 'pb-9' : ''} border rounded-[2px] disabled:bg-gray-100 text-sm outline-none focus:border-2 resize-none overflow-y-auto ${
                          mapping.fieldIdError
                            ? 'border-red-500 bg-[#FEF2F2] focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-400'
                        }`}
                      />
                      {mapping.fieldIdError && (
                        <Tooltip
                          title={mapping.fieldIdError}
                          arrow
                          placement='top'
                          slotProps={{
                            tooltip: {
                              sx: {
                                backgroundColor: '#FEF2F2',
                                mr: 1,
                              },
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
                <TableCell sx={{ p: '8px' }}>
                  <span className='text-[13px] font-medium text-[#425A76] capitalize'>
                    {mapping.field_type}
                  </span>
                </TableCell>
                <TableCell
                  sx={{
                    position: 'relative',
                    overflow: 'visible',
                    p: '8px',
                  }}
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
                            {item.type === 'chip' ? (
                              <Tooltip
                                title={getDisplayName(item.value, mapping.rid)}
                                arrow
                                placement='top'
                              >
                                <Chip
                                  label={getDisplayName(
                                    item.value,
                                    mapping.rid
                                  )}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f0f9ff',
                                    borderColor: '#0176D3',
                                    color: '#0176D3',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#0176D3',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'manual' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f0fdf4',
                                    borderColor: '#22c55e',
                                    color: '#16a34a',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#16a34a',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'function' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleFunctionChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f3e8ff',
                                    borderColor: '#9333ea',
                                    color: '#7e22ce',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#e9d5ff',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#7e22ce',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'number' ? (
                              <Tooltip title={item.value} arrow placement='top'>
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#fff7ed',
                                    borderColor: '#f97316',
                                    color: '#ea580c',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#ea580c',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'bracket' ? (
                              <Tooltip
                                title={`(${buildBracketDisplayLabel(item.bracketItems || [], mapping.rid)})`}
                                arrow
                                placement='top'
                              >
                                <Chip
                                  label={`(${buildBracketDisplayLabel(item.bracketItems || [], mapping.rid)})`}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleBracketChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#fdf4e9',
                                    borderColor: '#c2803b',
                                    color: '#7c4a15',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#fae5c8',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#7c4a15',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'conditional' ? (
                              <Tooltip
                                title={buildConditionalDisplayLabel(
                                  item.conditionalData,
                                  mapping.rid
                                )}
                                arrow
                                placement='top'
                              >
                                <Chip
                                  label={buildConditionalDisplayLabel(
                                    item.conditionalData,
                                    mapping.rid
                                  )}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleConditionalChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#fdf2f8',
                                    borderColor: '#f472b6',
                                    color: '#9d174d',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#cffafe',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#9d174d',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : item.type === 'sumOf' ? (
                              <Tooltip
                                title={`SUM(${item.sumOfArg?.type === 'chip' ? getDisplayName(item.sumOfArg.value, mapping.rid) : item.sumOfArg?.value || ''})`}
                                arrow
                                placement='top'
                              >
                                <Chip
                                  label={`SUM(${item.sumOfArg?.type === 'chip' ? getDisplayName(item.sumOfArg.value, mapping.rid) : item.sumOfArg?.value || ''})`}
                                  size='small'
                                  variant='outlined'
                                  onClick={() =>
                                    handleSumOfChipClick(mapping.rid, idx)
                                  }
                                  onDelete={() => removeChip(mapping.rid, idx)}
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    maxWidth: '200px',
                                    backgroundColor: '#f7fee7',
                                    borderColor: '#3f6212',
                                    color: '#3f6212',
                                    margin: '1px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      backgroundColor: '#ecfccb',
                                    },
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#3f6212',
                                      '&:hover': {
                                        color: '#ef4444',
                                      },
                                    },
                                    '& .MuiChip-label': {
                                      paddingLeft: '6px',
                                      paddingRight: '6px',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    },
                                  }}
                                />
                              </Tooltip>
                            ) : (
                              <Chip
                                label={item.value}
                                size='small'
                                variant='outlined'
                                onDelete={() =>
                                  removeOperator(mapping.rid, idx)
                                }
                                sx={{
                                  fontSize: '14px',
                                  height: '20px',
                                  maxWidth: '60px',
                                  backgroundColor: '#f7fa3245',
                                  borderColor: '#b9bb3dff',
                                  color: '#000',
                                  margin: '1px',
                                  borderRadius: '4px',
                                  '& .MuiChip-deleteIcon': {
                                    fontSize: '14px',
                                    color: '#616220ff',
                                    '&:hover': {
                                      color: '#ef4444',
                                    },
                                  },
                                  '& .MuiChip-label': {
                                    paddingLeft: '6px',
                                    paddingRight: '6px',
                                    paddingBottom:
                                      item.value === '*' ? '0px' : '2px',
                                    paddingTop:
                                      item.value === '*' ? '6px' : '0px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  },
                                }}
                              />
                            )}
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
                              ? 'Type @ fields, # for IDs, numbers, ( for Expression, MIN/MAX, SUM, IF or +, -, *, / for operators'
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
                              sx: {
                                backgroundColor: '#FEF2F2',
                                mr: 1,
                              },
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
                          style={{
                            zIndex: 9999,
                            maxHeight: '150px',
                          }}
                        >
                          {getFilteredOptions(mapping.rid).map(
                            (option, idx) => {
                              return (
                                <div
                                  key={idx}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800`}
                                  onMouseEnter={() =>
                                    setSelectedOptionIndex((prev) => ({
                                      ...prev,
                                      [mapping.rid]: idx,
                                    }))
                                  }
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    handleAutocompleteSelect(
                                      mapping.rid,
                                      option
                                    )
                                  }
                                >
                                  {getDisplayName(option, mapping.rid)}
                                </div>
                              );
                            }
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

      {/* Bracket Popover Dialog */}
      <Popover
        open={Boolean(bracketPopover)}
        anchorEl={bracketPopover?.anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        TransitionProps={{ timeout: 0 }}
        disableScrollLock
        sx={{ zIndex: 1200 }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              zIndex: 1200,
              width: bracketPopover?.anchorEl
                ? bracketPopover.anchorEl.clientWidth + 5
                : '450px',
              maxHeight: '400px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {bracketPopover && (
          <div className='flex flex-col p-4 gap-3'>
            {/* Header */}
            <div className='flex items-center gap-2'>
              <span className='text-sm font-semibold text-gray-700'>
                Build Bracket Expression
              </span>
              <span className='text-xs text-gray-400 '>( ... )</span>
            </div>
            <div className='text-xs text-gray-500 -mt-1'>
              Supports: <span className=''>@field</span>,{' '}
              <span className=''>#manual</span>, numbers, operators{' '}
              <span className=''>+ - * / %</span> and{' '}
              <span className=''>(</span> for nested sub-expressions
            </div>

            {/* Field Container */}
            <div className='relative'>
              <div
                className={`w-full max-h-[140px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
                  bracketPopover.error
                    ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                    : bracketPopover.nestedMode
                      ? 'border-teal-400 bg-white border-2'
                      : 'border-gray-300 bg-white focus-within:border-blue-400'
                }`}
                onClick={() => bracketPopoverInputRef.current?.focus()}
              >
                {/* Opening bracket indicator */}
                <span className='text-[13px] font-extrabold text-teal-600 self-center'>
                  ({' '}
                </span>

                {/* Main item chips */}
                {bracketPopover.items.map((item, idx) => (
                  <Tooltip
                    key={idx}
                    title={
                      item.type === 'chip'
                        ? getPopoverDisplayName(item.value)
                        : item.type === 'bracket' && item.nestedItems
                          ? `(${buildBracketDisplayLabel(item.nestedItems, bracketPopover.rid)})`
                          : item.value
                    }
                    arrow
                    placement='top'
                  >
                    <Chip
                      label={
                        item.type === 'chip'
                          ? getPopoverDisplayName(item.value)
                          : item.type === 'bracket' && item.nestedItems
                            ? `(${buildBracketDisplayLabel(item.nestedItems, bracketPopover.rid)})`
                            : item.value
                      }
                      size='small'
                      variant='outlined'
                      onDelete={() => removeBracketItem(idx)}
                      sx={{
                        fontSize: '11px',
                        height: '20px',
                        maxWidth: '180px',
                        borderRadius: '4px',
                        margin: '1px',
                        backgroundColor:
                          item.type === 'chip'
                            ? '#f0f9ff'
                            : item.type === 'manual'
                              ? '#f0fdf4'
                              : item.type === 'number'
                                ? '#fff7ed'
                                : item.type === 'bracket'
                                  ? '#fdf4e9'
                                  : '#fef9c3',
                        borderColor:
                          item.type === 'chip'
                            ? '#0176D3'
                            : item.type === 'manual'
                              ? '#22c55e'
                              : item.type === 'number'
                                ? '#f97316'
                                : item.type === 'bracket'
                                  ? '#c2803b'
                                  : '#eab308',
                        color:
                          item.type === 'chip'
                            ? '#0176D3'
                            : item.type === 'manual'
                              ? '#16a34a'
                              : item.type === 'number'
                                ? '#ea580c'
                                : item.type === 'bracket'
                                  ? '#7c4a15'
                                  : '#854d0e',
                        fontWeight: item.type === 'operator' ? 700 : 400,
                        borderStyle:
                          item.type === 'bracket' ? 'dashed' : 'solid',
                        '& .MuiChip-deleteIcon': {
                          fontSize: '14px',
                          color:
                            item.type === 'chip'
                              ? '#0176D3'
                              : item.type === 'manual'
                                ? '#16a34a'
                                : item.type === 'number'
                                  ? '#ea580c'
                                  : item.type === 'bracket'
                                    ? '#7c4a15'
                                    : '#854d0e',
                          '&:hover': { color: '#ef4444' },
                        },
                        '& .MuiChip-label': {
                          paddingLeft: '5px',
                          paddingRight: '5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  </Tooltip>
                ))}

                {/* Nested mode: show in-progress sub-bracket builder inline */}
                {bracketPopover.nestedMode && (
                  <div className='flex items-center gap-1 flex-wrap border border-dashed border-teal-400 bg-teal-50 rounded px-1.5 py-0.5 mx-0.5 w-full'>
                    <span className='text-[12px] font-extrabold text-[#7c4a15]'>
                      ({' '}
                    </span>
                    {(bracketPopover.nestedItems || []).map((nit, nIdx) => (
                      <Tooltip
                        key={nIdx}
                        title={
                          nit.type === 'chip'
                            ? getPopoverDisplayName(nit.value)
                            : nit.value
                        }
                        arrow
                        placement='top'
                      >
                        <Chip
                          label={
                            nit.type === 'chip'
                              ? getPopoverDisplayName(nit.value)
                              : nit.value
                          }
                          size='small'
                          variant='outlined'
                          onDelete={() => removeBracketItem(nIdx, true)}
                          sx={{
                            fontSize: '11px',
                            height: '18px',
                            maxWidth: '160px',
                            borderRadius: '3px',
                            margin: '0px',
                            backgroundColor:
                              nit.type === 'chip'
                                ? '#eff6ff'
                                : nit.type === 'manual'
                                  ? '#f0fdf4'
                                  : nit.type === 'number'
                                    ? '#fff7ed'
                                    : '#fef9c3',
                            borderColor:
                              nit.type === 'chip'
                                ? '#3b82f6'
                                : nit.type === 'manual'
                                  ? '#22c55e'
                                  : nit.type === 'number'
                                    ? '#f97316'
                                    : '#eab308',
                            color:
                              nit.type === 'chip'
                                ? '#1d4ed8'
                                : nit.type === 'manual'
                                  ? '#15803d'
                                  : nit.type === 'number'
                                    ? '#c2410c'
                                    : '#854d0e',
                            fontWeight: nit.type === 'operator' ? 700 : 400,
                            '& .MuiChip-deleteIcon': {
                              fontSize: '12px',
                              color:
                                nit.type === 'chip'
                                  ? '#1d4ed8'
                                  : nit.type === 'manual'
                                    ? '#15803d'
                                    : nit.type === 'number'
                                      ? '#c2410c'
                                      : '#854d0e',
                              '&:hover': { color: '#ef4444' },
                            },
                            '& .MuiChip-label': {
                              paddingLeft: '4px',
                              paddingRight: '4px',
                            },
                          }}
                        />
                      </Tooltip>
                    ))}
                    <input
                      ref={bracketPopoverInputRef}
                      type='text'
                      value={bracketPopover.inputValue}
                      onChange={(e) =>
                        handleBracketPopoverInputChange(e.target.value)
                      }
                      onKeyDown={handleBracketPopoverKeyDown}
                      placeholder={
                        (bracketPopover.nestedItems || []).length === 0
                          ? '@ field, # ID, number...'
                          : 'Add more...'
                      }
                      className='flex-1 min-w-0 border-none outline-none bg-transparent text-sm placeholder-gray-400'
                      style={{ minWidth: '60px' }}
                      autoFocus
                    />
                    <span className='text-[12px] font-extrabold text-[#7c4a15]'>
                      {' '}
                      )
                    </span>
                  </div>
                )}

                {/* Normal input (when NOT in nested mode) */}
                {!bracketPopover.nestedMode && (
                  <input
                    ref={bracketPopoverInputRef}
                    type='text'
                    value={bracketPopover.inputValue}
                    onChange={(e) =>
                      handleBracketPopoverInputChange(e.target.value)
                    }
                    onKeyDown={handleBracketPopoverKeyDown}
                    placeholder={
                      bracketPopover.items.length === 0
                        ? '@ field, # ID, number, ( for nested...'
                        : 'Add more...'
                    }
                    className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
                    style={{ minWidth: '80px' }}
                    autoFocus
                  />
                )}

                {/* Closing bracket indicator */}
                <span className='text-[13px] font-extrabold text-teal-600  self-center'>
                  {' '}
                  )
                </span>
              </div>

              {/* Autocomplete */}
              {bracketPopover.showAutocomplete && (
                <div
                  className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto z-[10000]'
                  style={{ maxHeight: '150px' }}
                >
                  {getPopoverFilteredOptions(
                    bracketPopover.inputValue.substring(
                      bracketPopover.inputValue.lastIndexOf('@') + 1
                    )
                  ).map((option, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-2 text-sm cursor-pointer ${
                        idx === (bracketPopover.autocompleteIndex || 0)
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        handleBracketPopoverAutocompleteSelect(option)
                      }
                    >
                      {getPopoverDisplayName(option)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nested mode hint — shows when building a sub-bracket */}
            {bracketPopover.nestedMode && (
              <div className='text-xs -mt-1 flex items-center gap-1.5 flex-wrap'>
                <span>Building nested bracket - type</span>
                <span className='bg-teal-50 border border-teal-300 rounded px-1 py-0.5'>
                  )
                </span>
                <span>to close it,</span>
                <span className='bg-teal-50 border border-teal-300 rounded px-1 py-0.5'>
                  Esc
                </span>
                <span>to cancel</span>
              </div>
            )}

            {/* Error Message */}
            {bracketPopover.error && (
              <div className='text-xs text-red-600 -mt-1.5'>
                {bracketPopover.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-end gap-2'>
              <TextButton
                label='Cancel'
                onClick={handleBracketPopoverCancel}
                sx={{
                  width: '70px',
                  minWidth: '70px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
              <TextButton
                label='Save'
                onClick={handleBracketPopoverSave}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          </div>
        )}
      </Popover>

      {/* SumOf Popover Dialog */}
      <Popover
        open={Boolean(sumOfPopover)}
        anchorEl={sumOfPopover?.anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        TransitionProps={{ timeout: 0 }}
        disableScrollLock
        sx={{ zIndex: 1200 }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              zIndex: 1200,
              width: sumOfPopover?.anchorEl
                ? sumOfPopover.anchorEl.clientWidth + 5
                : '350px',
              maxHeight: '300px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {sumOfPopover && (
          <div className='flex flex-col p-4 gap-3'>
            {/* Header */}
            <div className='text-sm font-semibold text-[#4d7c0f]'>
              Build Sum Expression
            </div>

            {/* Input Area */}
            <div className='flex flex-wrap items-center gap-1 border border-gray-300 rounded px-2 py-1.5 bg-white min-h-[32px]'>
              <span className='text-[12px] font-bold text-[#4d7c0f]'>SUM(</span>

              {/* Selected arg chip */}
              {sumOfPopover.selectedArg && (
                <Tooltip
                  title={
                    sumOfPopover.selectedArg.type === 'chip'
                      ? getPopoverDisplayName(sumOfPopover.selectedArg.value)
                      : sumOfPopover.selectedArg.value
                  }
                  arrow
                  placement='top'
                >
                  <Chip
                    label={
                      sumOfPopover.selectedArg.type === 'chip'
                        ? getPopoverDisplayName(sumOfPopover.selectedArg.value)
                        : sumOfPopover.selectedArg.value
                    }
                    size='small'
                    variant='outlined'
                    onDelete={() =>
                      setSumOfPopover({
                        ...sumOfPopover,
                        selectedArg: undefined,
                      })
                    }
                    sx={{
                      fontSize: '11px',
                      height: '20px',
                      maxWidth: '180px',
                      backgroundColor:
                        sumOfPopover.selectedArg.type === 'chip'
                          ? '#f0f9ff'
                          : '#f0fdf4',
                      borderColor:
                        sumOfPopover.selectedArg.type === 'chip'
                          ? '#0176D3'
                          : '#22c55e',
                      color:
                        sumOfPopover.selectedArg.type === 'chip'
                          ? '#0176D3'
                          : '#16a34a',
                      margin: '1px',
                      borderRadius: '4px',
                      '& .MuiChip-deleteIcon': {
                        fontSize: '14px',
                        '&:hover': { color: '#ef4444' },
                      },
                      '& .MuiChip-label': {
                        paddingLeft: '6px',
                        paddingRight: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  />
                </Tooltip>
              )}

              {/* Input field (only when no arg selected) */}
              {!sumOfPopover.selectedArg && (
                <input
                  ref={sumOfPopoverInputRef}
                  type='text'
                  value={sumOfPopover.inputValue}
                  onChange={(e) =>
                    handleSumOfPopoverInputChange(e.target.value)
                  }
                  onKeyDown={handleSumOfPopoverKeyDown}
                  placeholder='Type @ for fields or # for manual...'
                  className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400'
                  style={{ minWidth: '80px' }}
                  autoFocus
                />
              )}

              <span className='text-[12px] font-bold text-[#4d7c0f]'>)</span>
            </div>

            {/* Autocomplete dropdown */}
            {sumOfPopover.showAutocomplete && (
              <div
                className='bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto -mt-2'
                style={{ maxHeight: '120px' }}
              >
                {getPopoverFilteredOptions(
                  (sumOfPopover.inputValue || '').substring(
                    (sumOfPopover.inputValue || '').lastIndexOf('@') + 1
                  )
                ).map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      optIdx === (sumOfPopover.autocompleteIndex || 0)
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSumOfPopoverAutocompleteSelect(option)}
                  >
                    {option.includes('.')
                      ? getPopoverDisplayName(option)
                      : option}
                  </div>
                ))}
              </div>
            )}

            {/* Usage hint */}
            <div className='text-xs text-gray-500 -mt-1'>
              Use <span className='font-medium'>@</span> to select a field or{' '}
              <span className='font-medium'>#</span> for a manual value
            </div>

            {/* Error Message */}
            {sumOfPopover.error && (
              <div className='text-xs text-red-600 -mt-1.5'>
                {sumOfPopover.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-end gap-2'>
              <TextButton
                label='Cancel'
                onClick={handleSumOfPopoverCancel}
                sx={{
                  width: '70px',
                  minWidth: '70px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
              <TextButton
                label='Save'
                onClick={handleSumOfPopoverSave}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          </div>
        )}
      </Popover>

      {/* Function Popover Dialog */}
      <Popover
        open={Boolean(functionPopover)}
        anchorEl={functionPopover?.anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        TransitionProps={{
          timeout: 0,
        }}
        disableScrollLock
        sx={{ zIndex: 1100 }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              zIndex: 1100,
              width: functionPopover?.anchorEl
                ? functionPopover.anchorEl.clientWidth + 5
                : '450px',
              maxHeight: '400px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {functionPopover && (
          <div className='flex flex-col p-4 gap-3'>
            {/* Header */}
            <div className='text-sm font-semibold text-gray-700'>
              Build {functionPopover.type} Function
            </div>

            {/* Field Container - Same as Source Field */}
            <div className='relative'>
              <div
                className={`w-full max-h-[100px] overflow-y-auto px-2 py-1 border rounded-[2px] flex flex-wrap items-start gap-1 cursor-text focus-within:border-2 ${
                  functionPopover.error
                    ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                    : 'border-gray-300 bg-white focus-within:border-blue-400'
                }`}
                onClick={() => {
                  functionPopoverInputRef.current?.focus();
                }}
              >
                {/* Chips */}
                {functionPopover.args.map((arg, idx) => (
                  <Tooltip key={idx} title={arg.value} arrow placement='top'>
                    <Chip
                      key={idx}
                      label={arg.value}
                      size='small'
                      variant='outlined'
                      onDelete={() => removeFunctionPopoverChip(idx)}
                      sx={{
                        fontSize: '11px',
                        height: '20px',
                        maxWidth: '200px',
                        borderRadius: '4px',
                        backgroundColor:
                          arg.type === 'chip' ? '#f0f9ff' : '#f0fdf4',
                        borderColor:
                          arg.type === 'chip' ? '#0176D3' : '#22c55e',
                        color: arg.type === 'chip' ? '#0176D3' : '#16a34a',
                        margin: '1px',
                        '& .MuiChip-deleteIcon': {
                          fontSize: '14px',
                          color: arg.type === 'chip' ? '#0176D3' : '#16a34a',
                          '&:hover': {
                            color: '#ef4444',
                          },
                        },
                        '& .MuiChip-label': {
                          paddingLeft: '6px',
                          paddingRight: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  </Tooltip>
                ))}

                {/* Input Field */}
                <input
                  ref={functionPopoverInputRef}
                  type='text'
                  value={functionPopover.inputValue}
                  onChange={(e) =>
                    handleFunctionPopoverInputChange(e.target.value)
                  }
                  onKeyDown={handleFunctionPopoverKeyDown}
                  placeholder={
                    functionPopover.args.length === 0
                      ? 'Type @ to add fields or # for IDs'
                      : 'Add more...'
                  }
                  className='flex-1 min-w-0 border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400 align-top'
                  style={{ minWidth: '80px' }}
                  autoFocus
                />
              </div>

              {/* Autocomplete Dropdown */}
              {functionPopover.inputValue.includes('@') && (
                <div
                  className='absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-y-auto z-[10000]'
                  style={{ maxHeight: '150px' }}
                >
                  {getPopoverFilteredOptions(
                    functionPopover.inputValue.substring(
                      functionPopover.inputValue.lastIndexOf('@') + 1
                    )
                  ).map((option, idx) => (
                    <div
                      key={idx}
                      className='px-3 py-2 text-sm cursor-pointer hover:bg-blue-100 hover:text-blue-800'
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        handleFunctionPopoverAutocompleteSelect(option)
                      }
                    >
                      {getPopoverDisplayName(option)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {functionPopover.error && (
              <div className='text-xs text-red-600 -mt-1.5'>
                {functionPopover.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex justify-end gap-2'>
              <TextButton
                label='Cancel'
                onClick={handleFunctionPopoverCancel}
                sx={{
                  width: '70px',
                  minWidth: '70px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
              <TextButton
                label='Save'
                onClick={handleFunctionPopoverSave}
                disabled={functionPopover.args.length < 2}
                sx={{
                  width: '64px',
                  minWidth: '64px',
                  fontSize: '13px',
                  fontWeight: 400,
                }}
              />
            </div>
          </div>
        )}
      </Popover>

      {/* Conditional Popover Dialog */}
      <Popover
        open={Boolean(conditionalPopover)}
        anchorEl={conditionalPopover?.anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        TransitionProps={{
          timeout: 0,
        }}
        disableScrollLock
        sx={{ zIndex: 1100 }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: 'auto',
              zIndex: 1100,
              width: conditionalPopover?.anchorEl
                ? conditionalPopover.anchorEl.clientWidth + 5
                : '500px',
              maxHeight: '700px',
              overflow: 'visible',
              mt: '3px',
            },
          },
        }}
      >
        {conditionalPopover && (
          <div className='flex flex-col p-4 gap-3 bg-[#fff]'>
            {/* Header */}
            <div className='text-sm font-semibold text-gray-700 mb-1'>
              Build (if / else / else if) Condition
            </div>

            <div className='max-h-[250px] overflow-y-auto flex flex-col gap-0 px-1'>
              {conditionalPopover.clauses.map((clause, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-2 py-2 px-3 border border-[#CBD6E2] rounded-lg bg-white mb-1 shadow-sm relative ${
                    clause.showAutocomplete || clause.returnShowAutocomplete
                      ? 'z-[100]'
                      : 'z-[1]'
                  }`}
                >
                  {/* Remove Button for ELSE IF / ELSE */}
                  {clause.type !== 'IF' && (
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveClause(index)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        padding: '2px',
                        color: '#dc2626',
                        '&:hover': {
                          backgroundColor: '#fee2e2',
                        },
                      }}
                    >
                      <React.Suspense fallback={null}>
                        <CloseIcon className='w-4 h-4 p-0.5' />
                      </React.Suspense>
                    </IconButton>
                  )}

                  {/* Condition Part (IF and ELSE_IF) */}
                  {clause.type !== 'ELSE' && (
                    <div className='flex flex-col gap-2'>
                      <div className='text-sm font-bold text-gray-800'>
                        {clause.type === 'IF' ? 'if (' : 'else if ('}
                      </div>

                      <div
                        className={`relative ${clause.showAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                      >
                        <div
                          ref={(el) =>
                            (clauseContainerRefs.current[index] = el)
                          }
                          className={`w-full min-h-[40px] max-h-[80px] overflow-y-auto px-2 py-1 rounded-[2px] border flex flex-wrap items-start gap-1.5 cursor-text transition-all ${
                            clause.error
                              ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                              : 'border-gray-300 bg-white focus-within:border-blue-400'
                          }`}
                          onClick={() => {
                            clauseInputRefs.current[index]?.focus();
                          }}
                        >
                          {/* Chips */}
                          {(clause.expressions || []).map((item, chipIdx) => (
                            <div key={chipIdx}>
                              {item.type === 'chip' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleClauseRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#eff6ff',
                                      borderColor: '#3b82f6',
                                      color: '#1d4ed8',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#1d4ed8',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'manual' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleClauseRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#f0fdf4',
                                      borderColor: '#22c55e',
                                      color: '#15803d',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#15803d',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'number' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleClauseRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#fff7ed',
                                      borderColor: '#f97316',
                                      color: '#c2410c',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#c2410c',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'operator' ? (
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() =>
                                    handleClauseRemoveChip(index, chipIdx)
                                  }
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    fontWeight: 700,
                                    backgroundColor:
                                      item.value === '&&' || item.value === '||'
                                        ? '#fdf2f8'
                                        : '#fef9c3',
                                    borderColor:
                                      item.value === '&&' || item.value === '||'
                                        ? '#f472b6'
                                        : '#eab308',
                                    color:
                                      item.value === '&&' || item.value === '||'
                                        ? '#9d174d'
                                        : '#854d0e',
                                    borderRadius: '4px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color:
                                        item.value === '&&' ||
                                        item.value === '||'
                                          ? '#9d174d'
                                          : '#854d0e',
                                      '&:hover': { color: '#dc2626' },
                                    },
                                    '& .MuiChip-label': {
                                      paddingBottom:
                                        item.value === '*' ? '0px' : '2px',
                                      paddingTop:
                                        item.value === '*' ? '6px' : '0px',
                                    },
                                  }}
                                />
                              ) : item.type === 'bracket' ? (
                                <Tooltip
                                  title={`(${buildBracketDisplayLabel(item.bracketItems || [], conditionalPopover.rid)})`}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={`(${buildBracketDisplayLabel(item.bracketItems || [], conditionalPopover.rid)})`}
                                    size='small'
                                    variant='outlined'
                                    onClick={() =>
                                      handleClauseBracketChipClick(
                                        index,
                                        chipIdx
                                      )
                                    }
                                    onDelete={() =>
                                      handleClauseRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#fdf4e9',
                                      borderColor: '#c2803b',
                                      color: '#7c4a15',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: '#fae5c8',
                                      },
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#7c4a15',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                      '& .MuiChip-label': {
                                        paddingLeft: '6px',
                                        paddingRight: '6px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : null}
                            </div>
                          ))}

                          {/* Input */}
                          <input
                            ref={(el) => (clauseInputRefs.current[index] = el)}
                            type='text'
                            value={clause.inputValue || ''}
                            onChange={(e) =>
                              handleClauseInputChange(index, e.target.value)
                            }
                            onKeyDown={(e) => handleClauseKeyDown(index, e)}
                            placeholder={
                              (clause.expressions || []).length === 0
                                ? 'Type @ fields, # for IDs, ( for brackets, &&, ||, operators...'
                                : 'Add more...'
                            }
                            className='flex-1 min-w-[120px] rounded-[2px] border-none outline-none bg-transparent text-sm placeholder-gray-400'
                            autoComplete='off'
                          />
                        </div>

                        {/* Autocomplete */}
                        {clause.showAutocomplete &&
                          clauseContainerRefs.current[index] && (
                            <Popover
                              open={true}
                              anchorEl={clauseContainerRefs.current[index]}
                              onClose={() => {
                                const newClauses = [
                                  ...conditionalPopover.clauses,
                                ];
                                newClauses[index].showAutocomplete = false;
                                setConditionalPopover({
                                  ...conditionalPopover,
                                  clauses: newClauses,
                                });
                              }}
                              anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                              }}
                              transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                              }}
                              disableAutoFocus
                              disableEnforceFocus
                              slotProps={{
                                paper: {
                                  sx: {
                                    maxHeight: '200px',
                                    width:
                                      clauseContainerRefs.current[index]
                                        ?.clientWidth + 2 || '300px',
                                    mt: '4px',
                                    boxShadow:
                                      '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    border: '1px solid #d1d5db',
                                    zIndex: 1300,
                                  },
                                },
                              }}
                            >
                              <div className='bg-white max-h-[150px] overflow-y-auto'>
                                {getPopoverFilteredOptions(
                                  (clause.inputValue || '').substring(
                                    (clause.inputValue || '').lastIndexOf('@') +
                                      1
                                  )
                                ).map((option, idx) => (
                                  <div
                                    key={idx}
                                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0`}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      handleClauseAutocompleteSelect(
                                        index,
                                        option
                                      )
                                    }
                                  >
                                    {getPopoverDisplayName(option)}
                                  </div>
                                ))}
                              </div>
                            </Popover>
                          )}

                        {/* Individual Clause Error */}
                        {clause.error && (
                          <div className='text-xs text-red-600 mt-1'>
                            {clause.error}
                          </div>
                        )}
                      </div>

                      <div className='text-sm font-bold text-gray-800 '>
                        {` ) {`}
                      </div>
                    </div>
                  )}

                  {clause.type === 'ELSE' && (
                    <div className='text-sm font-bold text-gray-800  mb-2'>
                      else {'{'}
                    </div>
                  )}

                  {/* Return Field - ALL clause types */}
                  <div className='flex flex-col gap-2'>
                    <label className='text-sm font-bold text-gray-800'>
                      then
                    </label>
                    <div
                      className={`relative ${clause.returnShowAutocomplete ? 'z-[100]' : 'z-[1]'}`}
                    >
                      <div
                        ref={(el) => (returnContainerRefs.current[index] = el)}
                        className={`w-full min-h-[40px] max-h-[80px] overflow-y-auto px-2 py-1 rounded-[2px] border flex flex-wrap items-start gap-1.5 cursor-text transition-all ${
                          clause.returnError
                            ? 'border-red-500 bg-[#FEF2F2] focus-within:border-red-500'
                            : 'border-gray-300 bg-white focus-within:border-blue-400'
                        }`}
                        onClick={() => {
                          returnInputRefs.current[index]?.focus();
                        }}
                      >
                        {/* Return Chips */}
                        {(clause.returnExpressions || []).map(
                          (item, chipIdx) => (
                            <div key={chipIdx}>
                              {item.type === 'chip' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleReturnRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#eff6ff',
                                      borderColor: '#0176D3',
                                      color: '#0176D3',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#0176D3',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'manual' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleReturnRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#f0fdf4',
                                      borderColor: '#22c55e',
                                      color: '#15803d',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#15803d',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'number' ? (
                                <Tooltip
                                  title={item.value}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={item.value}
                                    size='small'
                                    variant='outlined'
                                    onDelete={() =>
                                      handleReturnRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#fff7ed',
                                      borderColor: '#f97316',
                                      color: '#c2410c',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#c2410c',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : item.type === 'operator' ? (
                                <Chip
                                  label={item.value}
                                  size='small'
                                  variant='outlined'
                                  onDelete={() =>
                                    handleReturnRemoveChip(index, chipIdx)
                                  }
                                  sx={{
                                    fontSize: '11px',
                                    height: '20px',
                                    fontWeight: 700,
                                    backgroundColor: '#fef9c3',
                                    borderColor: '#eab308',
                                    color: '#854d0e',
                                    borderRadius: '4px',
                                    '& .MuiChip-deleteIcon': {
                                      fontSize: '14px',
                                      color: '#854d0e',
                                      '&:hover': { color: '#dc2626' },
                                    },
                                    '& .MuiChip-label': {
                                      paddingBottom:
                                        item.value === '*' ? '0px' : '2px',
                                      paddingTop:
                                        item.value === '*' ? '6px' : '0px',
                                    },
                                  }}
                                />
                              ) : item.type === 'bracket' ? (
                                <Tooltip
                                  title={`(${buildBracketDisplayLabel(item.bracketItems || [], conditionalPopover.rid)})`}
                                  arrow
                                  placement='top'
                                >
                                  <Chip
                                    label={`(${buildBracketDisplayLabel(item.bracketItems || [], conditionalPopover.rid)})`}
                                    size='small'
                                    variant='outlined'
                                    onClick={() =>
                                      handleReturnBracketChipClick(
                                        index,
                                        chipIdx
                                      )
                                    }
                                    onDelete={() =>
                                      handleReturnRemoveChip(index, chipIdx)
                                    }
                                    sx={{
                                      fontSize: '11px',
                                      height: '20px',
                                      maxWidth: '150px',
                                      backgroundColor: '#fdf4e9',
                                      borderColor: '#c2803b',
                                      color: '#7c4a15',
                                      fontWeight: 500,
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        backgroundColor: '#fae5c8',
                                      },
                                      '& .MuiChip-deleteIcon': {
                                        fontSize: '14px',
                                        color: '#7c4a15',
                                        '&:hover': { color: '#dc2626' },
                                      },
                                      '& .MuiChip-label': {
                                        paddingLeft: '6px',
                                        paddingRight: '6px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      },
                                    }}
                                  />
                                </Tooltip>
                              ) : null}
                            </div>
                          )
                        )}

                        {/* Return Input */}
                        <input
                          ref={(el) => (returnInputRefs.current[index] = el)}
                          type='text'
                          value={clause.returnInputValue || ''}
                          onChange={(e) =>
                            handleReturnInputChange(index, e.target.value)
                          }
                          onKeyDown={(e) => handleReturnKeyDown(index, e)}
                          placeholder={
                            (clause.returnExpressions || []).length === 0
                              ? 'Type @ fields, # for IDs, ( for brackets, numbers...'
                              : 'Add more...'
                          }
                          className='flex-1 min-w-[120px] border-none outline-none rounded-[2px] bg-transparent text-sm placeholder-gray-400'
                        />
                      </div>

                      {/* Return Autocomplete */}
                      {clause.returnShowAutocomplete &&
                        returnContainerRefs.current[index] && (
                          <Popover
                            open={true}
                            anchorEl={returnContainerRefs.current[index]}
                            onClose={() => {
                              const newClauses = [
                                ...conditionalPopover.clauses,
                              ];
                              newClauses[index].returnShowAutocomplete = false;
                              setConditionalPopover({
                                ...conditionalPopover,
                                clauses: newClauses,
                              });
                            }}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'left',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'left',
                            }}
                            disableAutoFocus
                            disableEnforceFocus
                            slotProps={{
                              paper: {
                                sx: {
                                  maxHeight: '200px',
                                  width:
                                    returnContainerRefs.current[index]
                                      ?.clientWidth + 2 || '300px',
                                  mt: '4px',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                  border: '1px solid #d1d5db',
                                  zIndex: 1300,
                                },
                              },
                            }}
                          >
                            <div className='bg-white max-h-[150px] overflow-y-auto'>
                              {getPopoverFilteredOptions(
                                (clause.returnInputValue || '').substring(
                                  (clause.returnInputValue || '').lastIndexOf(
                                    '@'
                                  ) + 1
                                )
                              ).map((option, idx) => (
                                <div
                                  key={idx}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors border-b border-gray-50 last:border-0`}
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    handleReturnAutocompleteSelect(
                                      index,
                                      option
                                    )
                                  }
                                >
                                  {getPopoverDisplayName(option)}
                                </div>
                              ))}
                            </div>
                          </Popover>
                        )}

                      {/* Return Field Error */}
                      {clause.returnError && (
                        <div className='text-xs text-red-600 mt-1'>
                          {clause.returnError}
                        </div>
                      )}
                    </div>

                    <div className='text-sm font-bold text-gray-800 '>
                      {'}'}
                    </div>
                  </div>
                </div>
              ))}

              {/* Error Message */}
              {conditionalPopover.error && (
                <div className='text-xs text-red-600 my-1'>
                  {conditionalPopover.error}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex justify-between items-center'>
              <div className='flex gap-2'>
                <TextButton
                  label='else'
                  onClick={handleAddElse}
                  disabled={conditionalPopover.clauses.some(
                    (c) => c.type === 'ELSE'
                  )}
                  sx={{
                    width: '50px',
                    minWidth: '50px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
                <TextButton
                  label='else if'
                  onClick={handleAddElseIf}
                  disabled={conditionalPopover.clauses.some(
                    (c) => c.type === 'ELSE'
                  )}
                  sx={{
                    width: '60px',
                    minWidth: '60px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
              </div>
              <div className='flex justify-end gap-2'>
                <TextButton
                  label='Cancel'
                  onClick={handleConditionalPopoverCancel}
                  sx={{
                    width: '70px',
                    minWidth: '70px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
                <TextButton
                  label='Save'
                  onClick={handleConditionalPopoverSave}
                  sx={{
                    width: '64px',
                    minWidth: '64px',
                    fontSize: '13px',
                    fontWeight: 400,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Popover>
    </TableContainer>
  );
};

export default MappingTable;
