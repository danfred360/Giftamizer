import * as React from 'react';

import { useSnackbar } from 'notistack';
import { TransitionProps } from '@mui/material/transitions';
import { Close, Save, Settings } from '@mui/icons-material';

import {
	Alert,
	AlertTitle,
	AppBar,
	Button,
	Container,
	Dialog,
	Divider,
	Grid,
	IconButton,
	Link as MUILink,
	ListItemIcon,
	MenuItem,
	Slide,
	TextField,
	Toolbar,
	Typography,
	DialogActions,
	DialogContent,
	DialogTitle,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	Switch,
} from '@mui/material';

import { useGetProfile, useSupabase, useUpdateProfile, useUpdateTour } from '../lib/useSupabase';
import EmailEditor from './EmailEditor';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import ImageCropper from './ImageCropper';
import HomeSelector from './HomeSelector';

const Transition = React.forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement;
	},
	ref: React.Ref<unknown>
) {
	return <Slide direction='left' ref={ref} {...props} />;
});

export interface GroupsWithoutCoOwner {
	id: string;
	name: string;
	owner_count: number;
}

export type AccountDialogProps = {
	handleCloseMenu?(): void;
};

export default function AccountDialog(props: AccountDialogProps) {
	const { enqueueSnackbar } = useSnackbar();
	const navigate = useNavigate();
	const location = useLocation();

	const { client, user } = useSupabase();
	const { data: profile } = useGetProfile();

	const open = location.hash.startsWith('#my-account');

	const [firstName, setFirstName] = React.useState('');
	const [lastName, setLastName] = React.useState('');
	const [image, setImage] = React.useState<string | undefined>();
	const [bio, setBio] = React.useState('');
	const [home, setHome] = React.useState('/');

	const [enableLists, setEnableLists] = React.useState(false);
	const [enableArchive, setEnableArchive] = React.useState(false);
	const [enableTrash, setEnableTrash] = React.useState(false);

	const [enableSnowFall, setEnableSnowFall] = React.useState(false);

	const [emailPromotional, setEmailPromotional] = React.useState(false);
	const [emailInvites, setEmailInvites] = React.useState(false);

	const [groupsWithoutCoOwner, setGroupsWithoutCoOwner] = React.useState<GroupsWithoutCoOwner[] | undefined>();

	const deleteOpen = location.hash === '#my-account-delete';

	//
	// User tour
	const updateTour = useUpdateTour();

	React.useEffect(() => {
		const loadProfile = async () => {
			if (profile) {
				setFirstName(profile.first_name);
				setLastName(profile.last_name);
				setImage(profile.image);
				setBio(profile.bio);
				setHome(profile.home);

				setEnableLists(profile.enable_lists);
				setEnableArchive(profile.enable_archive);
				setEnableTrash(profile.enable_trash);

				setEnableSnowFall(profile.enable_snowfall);

				setEmailPromotional(profile.email_promotional);
				setEmailInvites(profile.email_invites);
			}

			const { data, error } = await client.rpc('get_groups_without_coowner', { owner_id: user.id });

			if (error) {
				console.log(error);

				enqueueSnackbar('Unable to query groups you own!', {
					variant: 'error',
				});
			} else {
				setGroupsWithoutCoOwner(data! as GroupsWithoutCoOwner[]);
			}
		};

		loadProfile();
	}, [client, enqueueSnackbar, user, profile, open]);

	const handleClickOpen = async () => {
		if (props.handleCloseMenu) props.handleCloseMenu();

		navigate('#my-account'); // open dialog
	};

	const handleClose = () => {
		navigate('#'); // close dialog
	};

	const updateProfile = useUpdateProfile();
	const handleSave = async () => {
		const listsOrig = profile?.enable_lists;

		updateProfile
			.mutateAsync({
				first_name: firstName,
				last_name: lastName,
				image: image,
				bio: bio,
				home: home,
				enable_lists: enableLists,
				enable_archive: enableArchive,
				enable_trash: enableTrash,
				enable_snowfall: enableSnowFall,
				email_promotional: emailPromotional,
				email_invites: emailInvites,
				avatar_token: profile?.avatar_token!,
			})
			.then(() => {
				navigate('#'); // close dialog

				if (listsOrig !== enableLists && enableLists) {
					updateTour.mutateAsync({
						list_tour_start: true,
					});
				}

				// navigate away from lists if active page
				if (!enableLists && location.pathname.startsWith('/lists')) {
					navigate('/');
				}
			})
			.catch((error) => {
				enqueueSnackbar(`Unable to update your profile. ${error}`, {
					variant: 'error',
				});
			});

		if ((!enableLists && location.pathname.startsWith('/list')) || (!enableArchive && location.pathname.startsWith('/archive')) || (!enableTrash && location.pathname.startsWith('/trash'))) {
			navigate('/');
		}
	};

	const handleDelete = async () => {
		const { data, error } = await client.functions.invoke('delete', {
			body: {
				user_id: user.id,
			},
		});

		if (error) {
			console.log(error);
			enqueueSnackbar(`Unable to delete your account. ${error}`, {
				variant: 'error',
			});
		}

		if (data === 'ok') {
			client.auth.signOut();
			navigate('/');
			enqueueSnackbar(`Your Giftamizer account and users data has been deleted.`, {
				variant: 'success',
			});
		}
	};

	return (
		<>
			<MenuItem onClick={handleClickOpen}>
				<ListItemIcon>
					<Settings fontSize='small' />
				</ListItemIcon>
				<Typography textAlign='center'>User Settings</Typography>
			</MenuItem>

			<Dialog onKeyDown={(e) => e.stopPropagation()} fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
				<AppBar position='fixed' color='primary' enableColorOnDark sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
					<Toolbar>
						<IconButton edge='start' color='inherit' onClick={handleClose} aria-label='close'>
							<Close />
						</IconButton>
						<Typography sx={{ ml: 2, flex: 1 }} variant='h6' component='div'>
							My Account
						</Typography>
						<IconButton edge='start' color='inherit' onClick={handleSave} aria-label='close' disabled={updateProfile.isLoading}>
							{updateProfile.isLoading ? <CircularProgress size={20} color='inherit' /> : <Save />}
						</IconButton>
					</Toolbar>
				</AppBar>
				<Toolbar />
				<Container maxWidth='md' sx={{ mt: 6, mb: 4 }}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<ImageCropper value={image} onChange={setImage} aspectRatio={1} />
							<Typography variant='h6' gutterBottom>
								Account Settings
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} sm={6}>
									<TextField fullWidth label='First Name' variant='outlined' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
								</Grid>
								<Grid item xs={12} sm={6}>
									<TextField fullWidth label='Last Name' variant='outlined' value={lastName} onChange={(e) => setLastName(e.target.value)} />
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								multiline
								minRows={3}
								maxRows={7}
								label='Bio'
								variant='outlined'
								inputProps={{ maxLength: 250 }}
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								helperText={`${bio.length} / 250`}
							/>
						</Grid>

						<Grid item xs={12}>
							<HomeSelector value={home} onChange={setHome} />
						</Grid>

						{user.app_metadata.provider === 'email' && (
							<Grid item xs={12}>
								<EmailEditor />
							</Grid>
						)}

						<Grid item xs={12}>
							<Divider />
						</Grid>

						<Grid item xs={12}>
							<Typography variant='h6' gutterBottom>
								Features
							</Typography>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={enableLists} onChange={(e) => setEnableLists(e.target.checked)} />} label='Lists' />
									<FormHelperText>
										Allows you to create item lists and assign them to groups. <i>Even create seperate managed lists for your kids or pets</i>
									</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={enableTrash} onChange={(e) => setEnableTrash(e.target.checked)} />} label='Trash Can' />
									<FormHelperText>Recover deleted items</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={enableArchive} onChange={(e) => setEnableArchive(e.target.checked)} />} label='Item Archive' />
									<FormHelperText>Hide items from groups without deleting them.</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>

						{(new Date().getMonth() === 10 || new Date().getMonth() === 11 || new Date().getMonth() === 0) && (
							<Grid item xs={12}>
								<FormControl component='fieldset' variant='standard'>
									<FormGroup>
										<FormControlLabel control={<Switch checked={enableSnowFall} onChange={(e) => setEnableSnowFall(e.target.checked)} />} label='Snow Fall ❄️' />
										<FormHelperText>Only available Nov-Jan.</FormHelperText>
									</FormGroup>
								</FormControl>
							</Grid>
						)}

						<Grid item xs={12}>
							<Divider />
						</Grid>

						<Grid item xs={12}>
							<Typography variant='h6' gutterBottom>
								Email Settings
							</Typography>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={emailPromotional} onChange={(e) => setEmailPromotional(e.target.checked)} />} label='Promotional' />
									<FormHelperText>New products and feature updates, as well as occasional company announcements and maintenance downtimes</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>
						<Grid item xs={12}>
							<FormControl component='fieldset' variant='standard'>
								<FormGroup>
									<FormControlLabel control={<Switch checked={emailInvites} onChange={(e) => setEmailInvites(e.target.checked)} />} label='Invites' />
									<FormHelperText>Get notified when someone invites you to a new group</FormHelperText>
								</FormGroup>
							</FormControl>
						</Grid>

						<Grid item xs={12}>
							<Divider />
						</Grid>

						<Grid item xs={12}>
							<Typography variant='h5' gutterBottom>
								Danger Zone
							</Typography>
							<Alert severity='error'>
								<AlertTitle>Delete Account</AlertTitle>

								<Grid container spacing={2}>
									{groupsWithoutCoOwner && groupsWithoutCoOwner.length > 0 ? (
										<>
											<Grid item xs={12}>
												<Typography variant='body1'>
													Your account is currently an owner of {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'}:{' '}
													{groupsWithoutCoOwner.map((g, i) => (
														<React.Fragment key={i}>
															<MUILink component={Link} to={`/groups/${g.id}#group-settings`} onClick={handleClose}>
																{g.name}
															</MUILink>
															{i !== groupsWithoutCoOwner.length - 1 && ', '}
														</React.Fragment>
													))}
												</Typography>
											</Grid>
											<Grid item xs={12}>
												<Typography variant='body1'>
													You must add another owner or delete {groupsWithoutCoOwner.length > 1 ? 'these groups' : 'this group'} before you can delete your account.
												</Typography>
											</Grid>
										</>
									) : (
										<Grid item xs={12}>
											<Typography variant='body1'>
												<b>This action is permanent! All user data will be deleted.</b>
											</Typography>
										</Grid>
									)}
									<Grid item xs={12}>
										<Button variant='outlined' color='error' disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0} onClick={() => navigate('#my-account-delete')}>
											Delete My Account
										</Button>
									</Grid>
								</Grid>
							</Alert>
						</Grid>

						<Grid item xs={12}>
							<Divider />
						</Grid>

						<Grid item xs={12}>
							<Typography variant='h6' gutterBottom>
								Support
							</Typography>
							<Typography variant='body1'>
								If you're experiencing any issues or just have a question, please contact us at <MUILink href='mailto:support@giftamizer.com'>support@giftamizer.com</MUILink>.
							</Typography>
						</Grid>

						<Grid item xs={12}>
							<MUILink
								sx={{
									cursor: 'pointer',
								}}
								onClick={() => {
									updateTour.mutateAsync({
										item_create_fab: false,
										item_name: false,
										item_url: false,
										item_more_links: false,
										item_custom_fields: false,
										item_image: false,
										item_create_btn: false,

										group_invite_nav: false,
										group_invite_button: false,

										group_nav: false,
										group_create_fab: false,
										group_create_name: false,
										group_create_image: false,
										group_create: false,
										group_card: false,
										group_settings: false,
										group_pin: false,
										group_member_card: false,
										group_member_item_status: false,
										group_member_item_status_taken: false,
										group_member_item_filter: false,

										group_settings_add_people: false,
										group_settings_permissions: false,

										list_tour_start: false,
										list_nav: false,
										list_intro: false,
										list_menu: false,
										list_edit: false,
										list_group_assign: false,

										shopping_nav: false,
										shopping_filter: false,
										shopping_item: false,
									});

									navigate('/');
								}}
							>
								Reset User Tour
							</MUILink>
						</Grid>
					</Grid>
				</Container>
			</Dialog>

			<Dialog open={deleteOpen} onClose={() => navigate('#my-account')}>
				<DialogTitle>Delete Account</DialogTitle>
				<DialogContent>
					<Typography variant='body1'>
						<b>This action is permanent! All user data will be deleted.</b>
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button color='inherit' onClick={() => navigate('#my-account')}>
						Cancel
					</Button>
					<Button color='error' variant='contained' onClick={handleDelete} disabled={!groupsWithoutCoOwner || groupsWithoutCoOwner.length > 0}>
						Yes Delete my Account
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
