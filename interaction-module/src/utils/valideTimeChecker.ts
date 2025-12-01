import moment from "moment";

export function isValidTimezone(tz: string) {
  return moment.tz.names().includes(tz);
}
