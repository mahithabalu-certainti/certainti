import React from 'react';

const createLazySvgIcon = (path: string) =>
  React.lazy(() =>
    import(`${path}`).then((module) => ({
      default: React.forwardRef((props, ref) =>
        React.createElement('img', { ...props, ref, src: module.default })
      ),
    }))
  );
export const AccountDetailsIcon = createLazySvgIcon('./account-details.svg');
export const AccountHomeIcon = createLazySvgIcon('./account-home.svg');
export const AccountSettingsIcon = createLazySvgIcon('./account-settings.svg');
export const AccountsIcon = createLazySvgIcon('./accounts.svg');
export const ActionIcon = createLazySvgIcon('./action.svg');
export const AddIcon = createLazySvgIcon('./addicon.svg');
export const AdministrationIcon = createLazySvgIcon('./administration.svg');
export const AdminChevronDownIcon = createLazySvgIcon(
  './admin-chevron-down.svg'
);
export const AdminChevronUpIcon = createLazySvgIcon('./admin-chevron-up.svg');
export const AdminPermissionIcon = createLazySvgIcon('./admin-permission.svg');
export const AdminSubmenuActiveIcon = createLazySvgIcon(
  './admin-submenu-active.svg'
);
export const AdminTemplateIcon = createLazySvgIcon('./admin-template.svg');
export const AllAccountIcon = createLazySvgIcon('./all-account.svg');
export const ArrowBackIcon = createLazySvgIcon('./arrowBackIcon.svg');
export const ArrowDownIcon = createLazySvgIcon('./arrow-down.svg');
export const ArrowIcon = createLazySvgIcon('./arrow-icon.svg');
export const ArrowUpIcon = createLazySvgIcon('./arrow-up.svg');
export const AttachmentIcon = createLazySvgIcon('./attachment.svg');
export const BackIcon = createLazySvgIcon('./chevron-double-left.svg');
export const BurgerMenuIcon = createLazySvgIcon('./burgerMenuIcon.svg');
export const CalendarIcon = createLazySvgIcon('./calendar.svg');
export const CaseIcon = createLazySvgIcon('./case.svg');
export const CheckboxChecked = createLazySvgIcon('./checkboxChecked.svg');
export const CheckboxUnchecked = createLazySvgIcon('./checkboxUnChecked.svg');
export const CheckedIcon = createLazySvgIcon('./checked-icon.svg');
export const ChecklistTemplateIcon = createLazySvgIcon(
  './checklist-template.svg'
);
export const ChevronDownIcon = createLazySvgIcon('./chevron-down.svg');
export const ChevronLeftIcon = createLazySvgIcon('./chevron-left.svg');
export const ChildAccountIcon = createLazySvgIcon('./child-account.svg');
export const CloseCircleIcon = createLazySvgIcon('./close-circle.svg');
export const CloseIcon = createLazySvgIcon('./close.svg');
export const ConfigureSettingIcon = createLazySvgIcon(
  './configure-setting.svg'
);
export const CreateResourceIcon = createLazySvgIcon('./create-resource.svg');
export const DashboardIcon = createLazySvgIcon('./dashboard.svg');
export const DeleteIcon = createLazySvgIcon('./delete-icon.svg');
export const DetailsKeyContactErrorIcon = createLazySvgIcon(
  './details-key-contact-error-icon.svg'
);
export const DownloadIcon = createLazySvgIcon('./download.svg');
export const EditIcon = createLazySvgIcon('./edit.svg');
export const EmailTemplateIcon = createLazySvgIcon('./email-template.svg');
export const ErrorInfoIcon = createLazySvgIcon('./error-info-icon.svg');
export const EyeIcon = createLazySvgIcon('./eye-icon.svg');
export const FilterArrowRightIcon = createLazySvgIcon(
  './filterArrowRightIcon.svg'
);
export const FilterIcon = createLazySvgIcon('./filter.svg');
export const FiscalYearArrowIcon = createLazySvgIcon(
  './fiscal-year-arrow-icon.svg'
);
export const GlobeIcon = createLazySvgIcon('./globe.svg');
export const HelpIcon = createLazySvgIcon('./help.svg');
export const ImportIcon = createLazySvgIcon('./import-icon.svg');
export const ImportTemplateIcon = createLazySvgIcon('./import-template.svg');
export const InteractionTemplateIcon = createLazySvgIcon(
  './interaction-template.svg'
);
export const KeyContactAddIcon = createLazySvgIcon(
  './key-contact-add-icon.svg'
);
export const KeyContactRemoveIcon = createLazySvgIcon(
  './key-contact-remove-icon.svg'
);
export const LeftArrowIcon = createLazySvgIcon('./left-arrow.svg');
export const Logo = createLazySvgIcon('./logo.svg');
export const LogoSmall = createLazySvgIcon('./logo-small.svg');
export const LogoutIcon = createLazySvgIcon('./logout.svg');
export const ManageGeoIcon = createLazySvgIcon('./manage-geo.svg');
export const ManageGroupIcon = createLazySvgIcon('./manage-group.svg');
export const ManagerUserIcon = createLazySvgIcon('./manager-user.svg');
export const ManageProfileIcon = createLazySvgIcon('./manage-profile.svg');
export const ManageSettingsIcon = createLazySvgIcon('./manage-settings.svg');
export const ManageUserAccessIcon = createLazySvgIcon(
  './manage-user-access.svg'
);
export const ManageUserIcon = createLazySvgIcon('./manage-user.svg');
export const MenuArrowRight = createLazySvgIcon('./menu-arrow-right.svg');
export const MenuArrowRightHover = createLazySvgIcon(
  './menu-arrow-right-hover.svg'
);
export const MenuIcon = createLazySvgIcon('./menu-icon.svg');
export const ModuleArrowRight = createLazySvgIcon('./module-arrow-right.svg');
export const NewFilterIcon = createLazySvgIcon('./filter-icon.svg');
export const NotesIcon = createLazySvgIcon('./notes.svg');
export const NotificationIcon = createLazySvgIcon('./notification.svg');
export const PhoneIcon = createLazySvgIcon('./phone.svg');
export const PlusIcon = createLazySvgIcon('./plus.svg');
export const ProfileIcon = createLazySvgIcon('./profile.svg');
export const ProjectCreateIcon = createLazySvgIcon('./new-project.svg');
export const ProjectDetailsIcon = createLazySvgIcon('./project-details.svg');
export const ProjectHeaderIcon = createLazySvgIcon('./projects-header.svg');
export const ProjectsBook = createLazySvgIcon('./project-book.svg');
export const ProjectsIcon = createLazySvgIcon('./projects.svg');
export const RealatedListDetailsIcon = createLazySvgIcon(
  './related-list-details-icon.svg'
);
export const RefreshIcon = createLazySvgIcon('./refresh.svg');
export const ResourceFilterIcon = createLazySvgIcon('./resourceFilterIcon.svg');
export const ResourceHeaderIcon = createLazySvgIcon('./resource-header.svg');
export const ResourceProfileIcon = createLazySvgIcon(
  './resourceProfileIcon.svg'
);
export const SearchBlackIcon = createLazySvgIcon('./search-black.svg');
export const SearchIcon = createLazySvgIcon('./search.svg');
export const SettingsIcon = createLazySvgIcon('./settings.svg');
export const SortIcon = createLazySvgIcon('./sort-icon.svg');
export const SurveyIcon = createLazySvgIcon('./survey.svg');
export const SurveyTemplateIcon = createLazySvgIcon('./survey-template.svg');
export const TaskTemplateIcon = createLazySvgIcon('./task-template.svg');
export const TimesheetIcon = createLazySvgIcon('./timesheet.svg');
export const UploadIcon = createLazySvgIcon('./Vector.svg');
export const UserIcon = createLazySvgIcon('./user.svg');
export const VerticalSeparatorIcon = createLazySvgIcon(
  './verticalSeparatorIcon.svg'
);
