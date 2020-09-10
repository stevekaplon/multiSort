import {Component, OnInit, ViewChild, ViewChildren, QueryList, TemplateRef, HostListener, Input, AfterViewInit, ViewEncapsulation, ChangeDetectorRef} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource, MatSortable, Sort, MatColumnDef} from '@angular/material';
import {tap} from 'rxjs/operators';
export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}
export interface ColumnFilterValueDef {
  value: string;
  label: string;
}
export class ColumnDef extends MatColumnDef {
  field: string;
  header?: string;
  dataType?: string;
  width?: string;
  sticky: boolean;
  nowrap?: boolean;
  filterable?: boolean;
  filterType?: string;
  filterValues?: ColumnFilterValueDef[];
  formatter?: (row) => string;
  template?: TemplateRef<any>;
  sortIndex?: number;
  isVisible?: boolean;
}
/** Constants used to fill up our data base. */
const COLORS: string[] = ['maroon', 'red', 'orange', 'yellow', 'olive'];
const NAMES: string[] = ['Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack',
  'Charlotte', 'Theodore', 'Isla', 'Oliver'];

/**
 * @title Data table with sorting, pagination, and filtering.
 */
@Component({
  selector: 'table-overview-example',
  styleUrls: ['table-overview-example.component.scss'],
  templateUrl: 'table-overview-example.component.html',
  encapsulation: ViewEncapsulation.None
})
export class TableOverviewExample implements OnInit, AfterViewInit {
  dataSource: MatTableDataSource<UserData>;
  allColumns: ColumnDef[];
  isMultiSort = true;
  multiSortOptions: Sort[] = []; // {active: 'name', direction: 'asc'} as Sort
  ctrlPressed = false;
  @Input() set defaultSortColumns(values: Sort[]) {
    this.multiSortOptions = values;
  }
  @ViewChildren(MatSort) matSorts: QueryList<MatSort>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @HostListener('window:keydown', ['$event'])handleKeyDown(event: KeyboardEvent) {
    this.ctrlPressed = event.ctrlKey || event.metaKey;
  }
  @HostListener('window:keyup', ['$event'])handleKeyUp(event: KeyboardEvent) {
    this.ctrlPressed = (event.ctrlKey || event.metaKey);
  }

  constructor(private changeDetectorRef: ChangeDetectorRef
    ) {
    this.allColumns = [
      {name: 'id', field: 'id', dataType: 'number'  } as ColumnDef,
      {name: 'name', field: 'name' } as ColumnDef,
      {name: 'progress', field: 'progress', dataType: 'number' } as ColumnDef,
      {name: 'color', field: 'color' } as ColumnDef,
    ];
    // Create 100 users
    const users = Array.from({length: 100}, (_, k) => createNewUser(k + 1));
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(users);

  }
  ngOnInit() {

    this.dataSource.paginator = this.paginator;
    this.dataSource.sortingDataAccessor = this.sortDataAccessor;
    const a = this.matSorts;

  }
  ngAfterViewInit() {
    setTimeout(() => {this.setMultiSortDefaults(this.matSorts.toArray()); });

  }

setMultiSortDefaults(matSorts: MatSort[]) {
  if (this.multiSortOptions && matSorts) {

  this.multiSortOptions.forEach( sc => {
    if (sc.direction !== '' && matSorts) {

      const matSort = matSorts.find(s => !!s.sortables.get(sc.active));
      if (matSort) {
        matSort.active = sc.active;
        matSort.direction = sc.direction;
        matSort.start = sc.direction;
        matSort.sortChange.emit();
      }
    }
  });
  this.sortDataSource();
}

}
  displayedColumns(): string[] {
    return this.allColumns.map(c => c.name);
  }
  handleMatSortChange(sortEvent: Sort) {
    if (sortEvent.active !== '') {
    this.setSortOptions(sortEvent);
  }
  }
  setSortOptions(newSort: Sort) {
    if (this.isMultiSort && this.ctrlPressed) {
      const exists = this.multiSortOptions.findIndex(o => o.active === newSort.active);
      if (exists >= 0) {
        if (newSort.direction !== '') {
          this.multiSortOptions[exists].direction = newSort.direction;
        } else {
          this.multiSortOptions.splice(exists, 1);
        }
    } else {
        if (newSort.direction !== '') {
          this.multiSortOptions.push(newSort);
        }
      }
      this.sortDataSource();
    } else {
      this.matSorts.forEach(s => {
        if (s.sortables.get(newSort.active) && newSort.direction) {
          this.dataSource.sort = s;
        } else {
          s.sort({id: '', start: 'asc', disableClear: false});
        }
      });
    }
  }
  sortDataSource() {
    console.log(this.multiSortOptions);
    this.dataSource.data.sort((a: any, b: any) => {
      let i = 0;
      let result = 0;
      while (i < this.multiSortOptions.length && result === 0) {
    result = (this.multiSortOptions[i].direction === 'asc' ? 1 : -1)
    *  (this.sortDataAccessor(a, this.multiSortOptions[i].active)  < this.sortDataAccessor(b, this.multiSortOptions[i].active) ?
     -1 : (this.sortDataAccessor(a, this.multiSortOptions[i].active) > this.sortDataAccessor(b, this.multiSortOptions[i].active) ? 1 : 0));
    i++;
  }
      return result;
  });
    this.dataSource.paginator = this.paginator;
  }


  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  sortDataAccessor = (item, property: string): number | string => {
    const columnDef = this.allColumns.find((c) => c.field === property);
    if (columnDef && columnDef.dataType === 'date') {
      const dateValue = this.nestedDataAccessor(item, property);
      // if data type is explicitly set to date, check if this is a date value so we can sort it correctly.
      const timestamp = Date.parse(dateValue);
      if (!isNaN(timestamp)) {
        return timestamp;
      }
    }

    // if data type is explicitly set to number, check if this is a number value so we can sort it correctly
    if (columnDef && columnDef.dataType === 'number') {
      const numericValue = this.nestedDataAccessor(item, property);
      const numValue = +numericValue;
      if (!isNaN(numValue)) {
        return numValue;
      }
    }

    // if no explicity data type, then try to determine if it is a date, number of string
    const value = this.valueDataAccessor(item, property);
    if (value) {
      // check if this is a date value so we can sort it correctly.
      const timestamp = Date.parse(value);
      if (!isNaN(timestamp)) {
        return timestamp;
      }

      // check if this is a number value so we can sort it correctly
      const numValue = +value;
      if (!isNaN(numValue)) {
        return numValue;
      }

      // return string as upper case
      if (value.toUpperCase) {
        return value.toUpperCase();
      }
    }

    return value;
  }
  valueDataAccessor = (row, property: string): string => {
    const columnDef = this.allColumns.find((c) => c.field === property);
    if (columnDef) {
      return columnDef.formatter
        ? columnDef.formatter(row)
        : this.nestedDataAccessor(row, columnDef.field);
    } else {
      return this.nestedDataAccessor(row, property);
    }
  }
  nestedDataAccessor = (item, property: string) => {
    if (property.includes('.')) {
      return property.split('.').reduce((object, key) => object[key], item);
    }
    return item[property];
  }
}

/** Builds and returns a new User. */
function createNewUser(id: number): UserData {
  const name =
      NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
      NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';

  return {
    id: id.toString(),
    name,
    progress: Math.round(Math.random() * 10).toString(),
    color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
  };

}
