interface Params {
  name: string
  id: string
}
export const getItemNameId = (items: any, detailedTraverse?: boolean) => {

  const result: Params[] = []

  items.forEach((obj: any) => {
    if (obj.children && detailedTraverse) {
      const el = { ...obj, ...{} };
      delete el.children;
      result.push({ name: el.name, id: el.id });
      Object.values(obj.children).map((v: any) => {
        result.push({ name: v.name, id: v.id });
        return 0;
      });
    } else {
      result.push({ name: obj.name, id: obj.id });
    }
    return;
  });

  return result
}


export const consoleTable = (object: any) => {
  console.clear()
  console.table(object)
}